# ===== Google Drive 업로드 =====
import os
import re
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from runtime_config import GOOGLE_CLIENT_SECRETS_PATH, GOOGLE_SCOPES, GOOGLE_TOKEN_PATH
from folder_layout import DRIVE_ROOT_FOLDER, lms_subfolders, normalize_layout

# Drive만 쓰지만, 권한 목록은 앱 전체와 같아야 한다.
# 여기서 Drive 권한만 요청하면 로그인할 때 token.json이 덮어써져
# 캘린더 권한이 사라진다.
SCOPES = GOOGLE_SCOPES
CREDENTIALS_PATH = GOOGLE_CLIENT_SECRETS_PATH
TOKEN_PATH = GOOGLE_TOKEN_PATH
ROOT_FOLDER = DRIVE_ROOT_FOLDER  # folder_layout 에 둔다 (화면 서버가 구글 라이브러리 없이 읽게)


def drive_folder_name(course_name):
    """'일반화학Ⅰ (General chemistryⅠ )_03[ 2026_1학기 ]' → '일반화학Ⅰ'."""
    text = str(course_name or '').strip()
    if '(' in text:
        head = text.split('(', 1)[0].strip()
        if head:
            text = head
    if '[' in text:
        text = text.split('[', 1)[0].strip()
    text = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', text).strip(' ._')
    return (text or '기타')[:60]

_service = None
_folder_cache = {}

class DriveLoginRequired(RuntimeError):
    """구글 로그인이 없거나 끊겨서, 창을 띄우지 않고는 드라이브를 쓸 수 없다."""


def authorize_drive(force=False, interactive=True):
    """Run the Google OAuth flow and save token.json for Drive uploads.

    interactive=False 이면 로그인 창을 열지 않고 DriveLoginRequired 를 던진다.
    뒤에서 도는 동기화 작업이 브라우저 로그인 창을 띄우고 하염없이 기다리면 안 된다.
    """
    global _service
    creds = None

    if not force and os.path.exists(TOKEN_PATH):
        # 파일에 실제로 담긴 권한 그대로 읽는다.
        # SCOPES를 넘기면 '요청한 권한'으로 덮어써져, 실제로 없는 권한도
        # 있는 것처럼 보인다.
        creds = Credentials.from_authorized_user_file(TOKEN_PATH)

    if creds and creds.valid:
        return creds

    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
        except Exception as exc:
            # 사용자가 구글 계정에서 권한을 해제했거나 오래 안 써서 만료된 경우
            if not interactive:
                raise DriveLoginRequired(f"구글 연결이 끊겼습니다: {exc}") from exc
            creds = None
    if not (creds and creds.valid):
        if not interactive:
            raise DriveLoginRequired("구글 계정에 로그인되어 있지 않습니다.")
        if not os.path.exists(CREDENTIALS_PATH):
            raise FileNotFoundError(
                f"Google OAuth credentials file not found: {CREDENTIALS_PATH}"
            )
        flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
        # PKCE: 매번 새로 만드는 검증값이 있어야 인증 코드를 토큰으로 바꿀 수 있다.
        # 데스크톱 앱은 client_secret 을 비밀로 지킬 수 없으므로, 보안이 여기에 기댄다.
        flow.autogenerate_code_verifier = True
        # 권한 하나를 끄고 허락해도 연결은 되게, 그리고 실제로 허락한 권한만 적는다 (runtime_config.granted_token_json)
        os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")
        creds = flow.run_local_server(port=0)

    from runtime_config import granted_token_json

    os.makedirs(os.path.dirname(TOKEN_PATH), exist_ok=True)
    with open(TOKEN_PATH, 'w', encoding='utf-8') as token:
        token.write(granted_token_json(creds))
    _service = None
    print("Google Drive OAuth 연결 완료!")
    return creds

def get_drive_service(interactive=True):
    global _service
    if _service:
        return _service
    creds = authorize_drive(force=False, interactive=interactive)
    _service = build('drive', 'v3', credentials=creds)
    return _service

def find_folder(service, name, parent_id=None):
    """이름이 같은 폴더를 찾기만 한다(없으면 None). 옛 정리 방식 자리를 확인할 때 빈 폴더를 만들지 않으려고."""
    cache_key = f"{parent_id}:{name}"
    if cache_key in _folder_cache:
        return _folder_cache[cache_key]
    query = f"name='{_q(name)}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
    if parent_id:
        query += f" and '{parent_id}' in parents"
    results = service.files().list(q=query, fields="files(id, name)").execute()
    files = results.get('files', [])
    if files:
        _folder_cache[cache_key] = files[0]['id']
        return files[0]['id']
    return None


def get_or_create_folder(service, name, parent_id=None):
    found = find_folder(service, name, parent_id)
    if found:
        return found
    cache_key = f"{parent_id}:{name}"

    metadata = {'name': name, 'mimeType': 'application/vnd.google-apps.folder'}
    if parent_id:
        metadata['parents'] = [parent_id]
    folder = service.files().create(body=metadata, fields='id').execute()
    print(f"폴더 생성: {name}")
    _folder_cache[cache_key] = folder['id']
    return folder['id']

def _q(text):
    """Drive 검색어 안의 글자. ' 가 든 이름(예: Professor's notes.pdf)은 검색이 깨져 업로드가 조용히 실패했다."""
    return str(text).replace("\\", "\\\\").replace("'", "\\'")


_listing_cache = {}


def _folder_listing(service, folder_id):
    """폴더 안 파일 목록을 한 번만 받아 둔다 (이름 → 파일).
    이제 기록된 파일 전부(수백 개)를 확인하므로, 파일마다 검색하면 Drive 요청이 수백 번 나간다."""
    if folder_id not in _listing_cache:
        listing = {}
        token = None
        while True:
            res = service.files().list(
                q=f"'{folder_id}' in parents and trashed=false",
                fields="nextPageToken, files(id, name, md5Checksum)",
                pageSize=1000, pageToken=token,
            ).execute()
            for f in res.get('files', []):
                listing.setdefault(f['name'], f)
            token = res.get('nextPageToken')
            if not token:
                break
        _listing_cache[folder_id] = listing
    return _listing_cache[folder_id]


def find_in_drive(service, file_name, folder_id):
    """폴더 안 같은 이름 파일 (id, md5). 없으면 None."""
    return _folder_listing(service, folder_id).get(file_name)


def file_exists_in_drive(service, file_name, folder_id):
    return find_in_drive(service, file_name, folder_id) is not None


def _md5(path):
    import hashlib
    h = hashlib.md5()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()

def _folder_chain(service, course_id, parts, create):
    """과목 폴더 아래 하위 폴더 경로의 마지막 폴더 id. create=False 면 없을 때 None."""
    parent = course_id
    for part in parts:
        parent = get_or_create_folder(service, part, parent) if create else find_folder(service, part, parent)
        if not parent:
            return None
    return parent


def upload_to_drive_with_path(file_path, file_name, course_name, folder_path=None, layout="lms"):
    """
    Drive 구조 (설정 FOLDER_LAYOUT, folder_layout.py):
      lms  : 내 드라이브 / AutoSaver / 과목명 / LMS 폴더(공지사항·주차…) / 파일
      flat : 내 드라이브 / AutoSaver / 과목명 / 파일
    예전에는 늘 flat 이었다. 방식이 바뀌면 다른 방식 자리에 올려 둔 파일을 새 자리로 옮긴다(다시 올리지 않음).
    옮기고 비어 버린 Drive 폴더는 지우지 않는다: 앱 권한(drive.file)으로는 사용자가 넣은 파일이 안 보여
    비었는지 확신할 수 없다.
    """
    try:
        service = get_drive_service()

        root_id = get_or_create_folder(service, ROOT_FOLDER)
        course_clean = drive_folder_name(course_name)
        course_id = get_or_create_folder(service, course_clean, root_id)
        lms_parts = lms_subfolders(folder_path)
        parts = lms_parts if normalize_layout(layout) == "lms" else []
        target_id = _folder_chain(service, course_id, parts, create=True)
        where = "/".join(["AutoSaver", course_clean, *parts])

        # 다른 정리 방식 자리(과목 폴더 바로 아래 ↔ LMS 하위 폴더)에 올려 둔 같은 파일을 새 자리로 옮긴다
        existing = find_in_drive(service, file_name, target_id)
        moved = False
        if not existing and lms_parts:
            alt_id = course_id if parts else _folder_chain(service, course_id, lms_parts, create=False)
            old = find_in_drive(service, file_name, alt_id) if alt_id and alt_id != target_id else None
            if old:
                done = service.files().update(
                    fileId=old['id'], addParents=target_id, removeParents=alt_id, fields='id, md5Checksum'
                ).execute()
                _folder_listing(service, alt_id).pop(file_name, None)
                existing = {**old, **done}
                _folder_listing(service, target_id)[file_name] = existing
                moved = True
                print(f"Drive 정리 방식대로 옮김: {file_name} → {where}")

        # Drive 에 같은 이름이 있으면: 내용이 같으면 건너뛰고, 다르면(교수가 고쳐 다시 올린 파일) 새 내용으로 바꾼다.
        # 예전에는 이름만 보고 건너뛰어, 고친 자료가 Drive 에는 옛 판으로 남았다.
        if existing:
            if existing.get('md5Checksum') and existing['md5Checksum'] == _md5(file_path):
                return 'moved' if moved else 'exists'
            media = MediaFileUpload(file_path, resumable=True)
            updated = service.files().update(fileId=existing['id'], media_body=media, fields='id, md5Checksum').execute()
            _folder_listing(service, target_id)[file_name] = {**existing, **updated}
            print(f"Drive 새 판으로 바꿈: {file_name} → {where}")
            return 'updated'

        file_metadata = {'name': file_name, 'parents': [target_id]}
        media = MediaFileUpload(file_path, resumable=True)
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webViewLink, md5Checksum'
        ).execute()
        _folder_listing(service, target_id)[file_name] = {'id': file.get('id'), 'name': file_name, 'md5Checksum': file.get('md5Checksum')}

        print(f"Drive 업로드 완료: {file_name} → {where}")
        return file.get('webViewLink', '')

    except Exception as e:
        print(f"Drive 업로드 실패 ({file_name}): {e}")
        return ''
