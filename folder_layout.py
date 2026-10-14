"""강의자료를 저장 위치(Drive·내 컴퓨터·클라우드 폴더)에 어떤 폴더 모양으로 둘지.

  lms  : 과목 / LMS 강의실의 폴더(공지사항·주차 폴더…) / 파일   ← 기본
  flat : 과목 / 파일 (하위 폴더 없이 과목 폴더에 모아 둠)

예전에는 내 컴퓨터는 LMS 폴더대로, Drive 는 과목 폴더에 모아 두어 둘의 모양이 달랐다.
사용자가 둘 중 고를 수 있게 하면서(2026-10-14) 한 설정(FOLDER_LAYOUT)이 모든 저장 위치에 쓰이게 했다.
web_ui(화면 서버)와 main(동기화 작업)이 같은 규칙을 쓰도록 무거운 것을 불러오지 않는 이 파일에 둔다.
"""
from __future__ import annotations

import re
from typing import Any

# Drive 맨 위 폴더 이름. 화면 설정(/api/config)이 이 이름 하나 읽으려고 drive_uploader 를 불러오면
# google.auth·googleapiclient 까지 따라 올라와 앱을 켠 뒤 첫 화면이 1초 늦었다(2026-10-15 실측 1.0s). 그래서 여기 둔다.
DRIVE_ROOT_FOLDER = "AutoSaver"

LAYOUTS = ("lms", "flat")
DEFAULT_LAYOUT = "lms"

# 화면에서 감추는 LMS 틀 폴더. 폴더 이름으로 쓰지 않는다.
HIDDEN_FOLDER_TITLES = {"weekly schedule", "ultradocumentbody"}


def normalize_layout(value: Any) -> str:
    text = str(value or "").strip().lower()
    return text if text in LAYOUTS else DEFAULT_LAYOUT


def safe_folder(text: str, limit: int = 60) -> str:
    """폴더 이름으로 쓸 수 있게 다듬는다."""
    cleaned = re.sub(r'[<>:"/\\|?*\x00-\x1f]', " ", str(text or "")).strip(" .")
    cleaned = re.sub(r"\s+", " ", cleaned)
    return (cleaned or "기타")[:limit].strip(" .") or "기타"


def lms_subfolders(folder_path: Any) -> list[str]:
    """LMS 폴더 경로(['1주차', 'Lecture 1'])를 폴더 이름으로 쓸 수 있게.

    'Weekly Schedule' 처럼 화면에서 감추는 틀 폴더는 뺀다. 이름마다 40자로 잘라 경로가 너무 길어지지 않게 한다.
    """
    parts = []
    for part in folder_path or []:
        text = str(part).strip()
        if text and text.lower() not in HIDDEN_FOLDER_TITLES:
            parts.append(safe_folder(text, 40))
    return parts


def layout_subfolders(folder_path: Any, layout: str) -> list[str]:
    """정리 방식에 맞는 과목 폴더 아래 경로. flat 이면 빈 목록(과목 폴더 바로 아래)."""
    return lms_subfolders(folder_path) if normalize_layout(layout) == "lms" else []
