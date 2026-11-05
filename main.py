# ===== 메인 실행 + 스케줄러 =====
import asyncio
import time
import os
from datetime import datetime, timezone
from runtime_config import (
    SCHEDULE_TIME, DOWNLOAD_PATH, DRIVE_UPLOAD, FOLDER_LAYOUT, AUTOSAVER_DATA_ROOT, atomic_write_json,
    course_upload_enabled, load_upload_selection,
)
from lms_crawler import crawl_lms, load_file_metadata, get_all_courses
import drive_uploader
from drive_uploader import (
    DriveLoginRequired, upload_to_drive_with_path, get_drive_service, get_or_create_folder, drive_folder_name, ROOT_FOLDER,
    drive_scope_granted, explain_error, get_root_folder,
)

# 마지막 Drive 올리기 결과. 화면 서버가 읽어 상단 Drive 불빛·설정 카드에 실패를 보인다(web_ui.get_status 'driveResult').
# 예전엔 올리기가 모두 실패해도 동기화는 '성공' 이었고 화면은 'Drive · 연결됨' 이라, 다른 PC 에서 아무것도 안 올라가도 알 수 없었다.
DRIVE_STATUS_PATH = AUTOSAVER_DATA_ROOT / "drive_status.json"


def _save_drive_status(**fields):
    try:
        atomic_write_json(DRIVE_STATUS_PATH, {
            "at": datetime.now(timezone.utc).isoformat(), "folder": ROOT_FOLDER, **fields,
        }, ensure_ascii=False, indent=2)
    except OSError:
        pass
from email_notifier import send_kakao_message

async def run_job():
    print("\n" + "="*50)
    print("LMS 자동 저장 시작!")
    print("="*50)

    # 1. LMS에서 새 파일 수집
    new_files = await crawl_lms()

    # 설정 > 강의자료 저장에서 드라이브를 끄면 LMS 에서 받기만 하고 끝낸다.
    # (내 컴퓨터 자동 저장은 이 작업이 끝난 뒤 web_ui 가 따로 맞춘다)
    if not DRIVE_UPLOAD:
        print("\n[Drive] 설정에서 꺼 두어 올리지 않습니다.")
        _notify_new_files(new_files)
        print("\n✅ 모든 작업 완료!")
        return

    # 구글 로그인을 안 한 사용자도 많다. 드라이브 저장은 기본으로 켜져 있어서, 예전에는
    # 여기서 오류가 나 동기화 전체가 '실패' 로 끝났고 뒤따르는 폴더 정리·내 컴퓨터 저장도 건너뛰었다.
    # 로그인이 없거나 끊겼으면 드라이브만 건너뛴다 (뒤에서 로그인 창을 띄우지도 않는다).
    try:
        service = get_drive_service(interactive=False)
    except DriveLoginRequired as exc:
        print(f"\n[Drive] {exc} 드라이브에는 올리지 않았습니다. (설정 > 연결된 계정에서 로그인)")
        _save_drive_status(state="login", error=str(exc))
        _notify_new_files(new_files)
        print("\n✅ 모든 작업 완료!")
        return
    if not drive_scope_granted():
        message = explain_error(RuntimeError("insufficient scope"))
        print(f"\n[Drive] {message}")
        _save_drive_status(state="scope", error=message)
        _notify_new_files(new_files)
        print("\n✅ 모든 작업 완료!")
        return

    # 2. 파일 메타데이터 로드
    file_metadata = load_file_metadata()

    # 3. 사용자가 선택한 과목만 Drive 폴더 생성 (파일 없어도)
    upload_selection = load_upload_selection()
    print("\n[Drive 과목 폴더 생성]")
    all_courses = await get_all_courses()
    # 여기서 난 오류(권한·공간·인터넷)가 동기화 전체를 '실패' 로 만들어 뒤따르는 폴더 정리·내 컴퓨터 저장까지 건너뛰지 않게,
    # Drive 만 멈추고 까닭을 남긴다
    try:
        root_id = get_root_folder(service)
        for course_name in all_courses:
            if not course_upload_enabled(course_name, upload_selection):
                continue
            get_or_create_folder(service, drive_folder_name(course_name), root_id)
    except Exception as exc:
        message = explain_error(exc)
        print(f"[Drive] 폴더를 만들지 못해 올리지 않았습니다: {message} ({exc})")
        _save_drive_status(state="error", error=message)
        _notify_new_files(new_files)
        print("\n✅ 모든 작업 완료!")
        return
    print(f"Drive 폴더: 내 드라이브 / {ROOT_FOLDER}")

    # 4. 로컬 파일 전체를 Drive에 동기화 (선택된 과목만)
    print("\n[Drive 동기화 시작]")
    uploaded_count = 0
    skipped_count = 0
    excluded_count = 0

    # 다운로드 경로가 개인 Downloads 폴더로 잡혀 있을 수 있다.
    # 폴더 안의 파일을 전부 훑으면 앱과 무관한 개인 파일(문서, 설치 파일,
    # 심지어 client_secret 같은 비밀키)까지 Drive로 올라간다.
    # 그래서 '앱이 직접 받아 기록해 둔 파일'만 올린다.
    personal_count = 0

    # 받은 파일은 동기화가 끝나면 '학기/과목' 폴더로 옮겨지고, 고쳐 다시 올라온 파일은 그 자리에 덮어써진다.
    # 예전에는 맨 위 폴더만 훑어서 그런 파일은 Drive 에 다시는 안 올라갔다.
    # 이제는 기록(메타데이터)에 적힌 자리를 따라가 찾는다. 기록에 없는 파일은 여전히 올리지 않는다.
    targets = []
    if os.path.exists(DOWNLOAD_PATH):
        for local_name, meta in file_metadata.items():
            if not isinstance(meta, dict):
                continue
            stored = meta.get('stored') or local_name
            path = os.path.join(DOWNLOAD_PATH, stored)
            if not os.path.isfile(path):
                path = os.path.join(DOWNLOAD_PATH, local_name)
            if os.path.isfile(path):
                targets.append((local_name, path, meta))
        known = {os.path.normcase(os.path.abspath(p)) for _, p, _ in targets}
        for file_name in os.listdir(DOWNLOAD_PATH):
            p = os.path.join(DOWNLOAD_PATH, file_name)
            if os.path.isfile(p) and os.path.normcase(os.path.abspath(p)) not in known:
                # 앱이 받은 기록이 없는 파일 = 사용자 개인 파일. 절대 올리지 않는다.
                personal_count += 1

    updated_count = 0
    moved_count = 0  # 정리 방식(LMS 폴더 그대로 ↔ 과목 폴더에 모아서)을 바꿔 Drive 안에서 옮긴 것
    failed_count = 0
    first_error = ""
    if targets:
        for file_name, file_path, meta in targets:

            course_name = meta.get('course', '기타')
            folder_path = meta.get('folder_path', [])
            drive_file_name = meta.get('original_name', file_name)

            if not course_upload_enabled(course_name, upload_selection):
                excluded_count += 1
                continue

            result = upload_to_drive_with_path(
                file_path, drive_file_name, course_name, folder_path, FOLDER_LAYOUT
            )
            if result == 'moved':
                moved_count += 1
            elif result == 'exists':
                skipped_count += 1
            elif result == 'updated':
                updated_count += 1
            elif result:
                uploaded_count += 1
            else:
                failed_count += 1
                first_error = first_error or drive_uploader.last_error

    summary = f"[Drive 동기화 완료] 신규 {uploaded_count}개 업로드, 새 판 {updated_count}개 교체, 기존 {skipped_count}개 스킵, 선택 제외 {excluded_count}개"
    if moved_count:
        summary += f", 정리 방식대로 옮김 {moved_count}개"
    if personal_count:
        summary += f", 앱과 무관한 개인 파일 {personal_count}개는 건드리지 않음"
    if failed_count:
        summary += f", 실패 {failed_count}개 ({first_error})"
    print(summary)
    _save_drive_status(
        state="error" if failed_count else "ok", error=first_error if failed_count else "",
        uploaded=uploaded_count, updated=updated_count, exists=skipped_count, moved=moved_count, failed=failed_count,
    )

    # 5. 이메일 알림
    _notify_new_files(new_files)

    print("\n✅ 모든 작업 완료!")


def _notify_new_files(new_files):
    if new_files:
        message = f"📚 DGIST LMS 새 파일!\n\n총 {len(new_files)}개\n\n"
        for r in new_files[:10]:
            message += f"📖 [{r['course'][:15]}]\n{r['name']}\n\n"
        if len(new_files) > 10:
            message += f"... 외 {len(new_files)-10}개\n"
        send_kakao_message(message)
    else:
        send_kakao_message("📚 DGIST LMS\n새로운 파일이 없습니다.")

def job():
    asyncio.run(run_job())

if __name__ == "__main__":
    import schedule

    print(f"LMS 자동 저장 프로그램 시작!")
    print(f"매일 {SCHEDULE_TIME}에 자동 실행됩니다.")
    print("지금 바로 실행하려면 Enter, 스케줄만 등록하려면 Ctrl+C")

    try:
        input()
        job()
    except KeyboardInterrupt:
        pass

    schedule.every().day.at(SCHEDULE_TIME).do(job)
    print(f"\n스케줄 등록 완료! ({SCHEDULE_TIME} 자동 실행)")

    while True:
        schedule.run_pending()
        time.sleep(60)
