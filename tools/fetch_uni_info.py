"""FGLP·학점교류 대학의 홈페이지·기본 정보·사진 여러 장을 받아 앱 안에 넣어 둔다.

왜 미리 받아 두는가 (fetch_uni_photos.py 와 같은 이유)
  화면에서 바로 바깥 주소를 부르면 인터넷이 없을 때 비고, 어느 대학을
  들여다보는지도 바깥에 알려진다. 한 번 받아 두고 앱 안에서만 읽는다.

어디서 가져오나
  - 홈페이지·설립 연도·학생 수·국공립/사립: 위키데이터(CC0).
  - 한 줄 소개는 넣지 않는다. 한국어 위키백과 첫 문장은 '최상위권 명문', '전세계 최고' 같은 자랑이 많고
    ('브리티시 컬럼비아 대학교, 약칭 UBC.' 처럼 빈 것도 있었다), 위키데이터 한국어 설명은 절반이 비어 있다.
    대신 영어 설명(위키데이터)에서 공립·사립·연구중심만 뽑고, 위키백과 링크를 단다.
  - 사진: 사람이 고른 위키미디어 커먼스 사진(PICKS). 작성자·라이선스를 같이 적는다.
  - 여름학기 안내 주소: 손으로 적은 후보(SUMMER) 중 실제로 열리고 제목에 summer 가 있는 것만 남긴다.
  모르는 값은 비워 둔다. 지어내지 않는다.

쓰는 법:  python tools/fetch_uni_info.py   (다시 돌리면 이미 받은 사진은 건너뛴다)
          사진 줄이기에 Pillow 가 필요해 시스템 파이썬으로 돌린다(.venv 에는 없다, 앱에는 불필요).
"""

from __future__ import annotations

import json
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
sys.path.insert(0, str(ROOT))

from fetch_uni_photos import TITLES, UA, slug  # noqa: E402
import fglp  # noqa: E402

# 지금 목록(2027 안내서)에 있는 대학만. TITLES 에는 빠진 곳(Innsbruck)도 남아 있다.
CURRENT = {row[0] for row in fglp._FGLP} | {row[0] for row in fglp._EXCHANGE}

OUT_DIR = ROOT / "web" / "img" / "uni"
META_PATH = ROOT / "uni_info.json"
CTX = ssl.create_default_context()

# 여름학기(FGLP 가 듣는 정규 여름 수업) 안내 후보. 확인을 통과한 것만 남는다.
SUMMER = {
    "UC Berkeley": "https://summer.berkeley.edu/",
    "UCLA": "https://summer.ucla.edu/",
    "UC Irvine": "https://summer.uci.edu/",
    "Stanford University": "https://summer.stanford.edu/",
    "Harvard University": "https://summer.harvard.edu/",
    "University of Wisconsin–Madison": "https://summer.wisc.edu/",
    "Boston University": "https://www.bu.edu/summer/",
    "Purdue University": "https://www.purdue.edu/summer/",
    "University of Virginia": "https://summer.virginia.edu/",
    "Johns Hopkins University": "https://summer.jhu.edu/international-students/",
    "Arizona State University": "https://summer.asu.edu/",
    "University of British Columbia": "https://vancouversummerprogram.ubc.ca/",
    "Maastricht University": "https://www.maastrichtuniversity.nl/summerschool/",
    "Utrecht University": "https://utrechtsummerschool.nl/",
    "RWTH Aachen University": "https://www.academy.rwth-aachen.de/en/education-formats/summer-schools",
    "University of Cambridge": "https://www.pace.cam.ac.uk/course-type/international-summer-programme",
    "Aalto University": "https://www.aalto.fi/en/aaltosummer",
    "National Taiwan University": "https://oia.ntu.edu.tw/short-term-programs/",
    "Nanyang Technological University": "https://www.ntu.edu.sg/education/student-exchanges/inbound-summer",
    "Hokkaido University": "https://hokkaidosummerinstitute.oia.hokudai.ac.jp/en/program_overview/",
    "Waseda University": "https://www.waseda.jp/inst/gip/summer-session",
    "Chinese University of Hong Kong": "https://www.oal.cuhk.edu.hk/summer/",
    "HKUST": "https://summercampus.hkust.edu.hk/summer-school",
    "Dublin City University": "https://english.dcu.ie/courses/international-summer-school/",
    "ESME": "https://www.esme.fr/en/summer-school/",
}

# 웹 검색(2026-10-21)으로 학교 공식 도메인에서 확인한 주소. 봇 차단(403)·인증서 사슬 문제로 스크립트 확인이
# 실패해도 남긴다. INSA Lyon·Calgary·RMIT 는 방문 학생용 여름 정규 수업 안내를 찾지 못해 비워 둔다.
SUMMER_SEARCHED = {
    "https://summer.jhu.edu/international-students/",
    "https://www.pace.cam.ac.uk/course-type/international-summer-programme",
    "https://www.maastrichtuniversity.nl/summerschool/",
    "https://www.aalto.fi/en/aaltosummer",
    "https://oia.ntu.edu.tw/short-term-programs/",
    "https://www.ntu.edu.sg/education/student-exchanges/inbound-summer",
    "https://vancouversummerprogram.ubc.ca/",
    "https://www.waseda.jp/inst/gip/summer-session",
    "https://www.academy.rwth-aachen.de/en/education-formats/summer-schools",
    "https://hokkaidosummerinstitute.oia.hokudai.ac.jp/en/program_overview/",
    "https://summercampus.hkust.edu.hk/summer-school",
    "https://english.dcu.ie/courses/international-summer-school/",
}

# 사진은 사람이 고른다 (2026-10-21). 커먼스 분류를 자동으로 훑었더니 고무도장·나무·백신 상자 같은
# 엉뚱한 사진이 대부분이었다. 영어 위키백과 문서에 실린 사진(편집자가 고른 것)과 커먼스 검색에서
# 후보를 모아 한 장씩 보고 캠퍼스·건물 사진만 골랐다. 파일 이름(커먼스) 그대로 적는다.
PICKS = {
    'harvard-university': [
        'Aerial of the Harvard Business School campus.jpeg',
        'Harvard Medical School (54954429258).jpg',
        'Sanders theater 2009y.JPG',
    ],
    'stanford-university': [
        'Stanford University Arches with Memorial Church in the background.jpg',
        'Stanford University Green Library Bing Wing.jpg',
        'Claw Fountain at Stanford Univerisity.JPG',
    ],
    'johns-hopkins-university': [
        'The Beach, JHU.jpg',
        'View from Levering Plaza.jpg',
        'George-peabody-library.jpg',
    ],
    'university-of-virginia': [
        'University of Virginia Rotunda in 2006.jpg',
        'The Rotunda and Lawn University of Virginia Charlottesville VA March 2011.jpg',
        'Rotunda at University of Virginia.jpg',
    ],
    'boston-university': [
        'Boston at sunset.jpg',
        'BU Boathouse.jpg',
        'Boston University College of Arts and Sciences.jpg',
    ],
    'purdue-university': [
        'Engineering Fountain Purdue University 2016 03.jpg',
        'Purdue University, West Lafayette, Indiana, Estados Unidos, 2012-10-15, DD 23.jpg',
        'Purdue University, West Lafayette, Indiana, Estados Unidos, 2012-10-15, DD 12.jpg',
    ],
    'uc-berkeley': [
        'Sather Gate at University of California, Berkeley, California LCCN2013633500 (edited).jpg',
        'UCB Doe Memorial Library oblique view dllu.jpg',
        'South Hall--UC Berkeley--Panoramic.jpg',
    ],
    'ucla': [
        'Royce Hall post rain.jpg',
        'Legally Blonde filming location at Kerckhoff Hall at UCLA.jpg',
        'UCLA School of Law south entrance.jpg',
    ],
    'university-of-wisconsin-madison': [
        'Agriculture Hall Madison.jpg',
        'Bascom Mall, University of Wisconsin, Madison, WI - 54302232407.jpg',
        'Madison 06-16-2012 029 (7398597206).jpg',
    ],
    'arizona-state-university': [
        '2021 Arizona State University, Tempe Campus, Old Main.jpg',
        'Tempe-Grady Gammage Memorial Auditorium-1950 crop.JPG',
        'ASU Downtown - SoJ SWC - 2008-12-29.jpg',
    ],
    'university-of-cambridge': [
        '20130808 Castle End from Kings Bridge.jpg',
        "Bridge of Sighs, St John's College, Cambridge, UK - Diliff.jpg",
        'Cmglee Cambridge Trinity College Great Court.jpg',
    ],
    'maastricht-university': [
        '2018-Maastricht, Bonnefantenklooster, Ezelmarkt.jpg',
        '2018-Maastricht, Bonnefantenkerk, interieur.jpg',
        '2019 Maastricht-Randwyck, MUMC+ (11).jpg',
    ],
    'hkust': [
        'HKUST campus view looking from above.jpg',
        'Hong Kong University of Science & Technology (2889127648).jpg',
        'HKUSTlibraryfront.JPG',
    ],
    'chinese-university-of-hong-kong': [
        '2023年8月-中大航拍.jpg',
        'Chinese University of Hong Kong 香港中文大學.JPG',
        'Lake Ad Excellentiam tree view 201602.jpg',
    ],
    'nanyang-technological-university': [
        '666 02 Learning Hub Surrounding context of the Learning Hub CREDIT Hufton and Crow.jpg',
        '2016-08-18 Nanyang Technological University Library Outpost SG WMN0001.jpg',
        'NTU North Spine.jpg',
    ],
    'hokkaido-university': [
        'Gingko Ave. in Fall.jpg',
        'Hokkaido-Univ-Museum-01.jpg',
        'Hokkaido-Univ-Furukawa-Hall-01.jpg',
    ],
    'insa-lyon': [
        'Villeurbanne - INSA Lyon - Bâtiment et esplanade premier cycle.jpg',
        'Cône de Lübeck INSA Lyon.jpg',
    ],
    'aalto-university': [
        'Aalto yliopisto Otaniemi 2018.jpg',
        'Otaniemi,Espoo, Aalto University.jpg',
        'Otaniemi campus library.jpg',
    ],
    'ulm-university': [
        'Uniulmnord.jpg',
        'Universität Ulm.jpg',
        'Universitätsklinikum Ulm Chirurgie.jpg',
    ],
    'ko-university': [
        'KoçUniversity2.jpg',
        'Koç Üniversitesi Ana Kampüs Bilim Kapısı.JPG',
        'Koç University Rumelifeneri Campus.jpg',
    ],
    'university-of-groningen': [
        'Academiegebouw Groningen 1202 - 1205.jpg',
        'RuG Linnaeusborg panorama.JPG',
        'Feringa Buiding.jpg',
    ],
    'universiti-malaya': [
        'Universiti Malaya KL gate.jpg',
        'University of Malaya City View.jpg',
        'Gambar Dewan Tunku Canselor, Universiti Malaya.jpg',
    ],
    'national-yang-ming-chiao-tung-university': [
        '2019.03.13 Aerial view of NYCU Guangfu Campus.jpg',
        'NYCU Dining hall 2.jpg',
        'NYCU HSS building I 01.jpg',
    ],
    'osaka-university': [
        'Osaka University Faculty of Medicine.jpg',
        'Osaka University Minoh Campus 2021-08 ac (2).jpg',
        'Osaka University toyonaka daigaku-hall.jpg',
    ],
    'dalian-university-of-technology': [
        'Dalian University of Technology.jpg',
        'Lingxi Library.JPG',
        'Dalian University of Technology - Science Park B Bldg.jpg',
    ],
    'uc-irvine': [
        'Campus of the University of California, Irvine (aerial view, circa 2006).jpg',
        'Humanities Gateway.jpg',
        'UC Irvine Reines Hall.jpg',
    ],
    'university-of-british-columbia': [
        'Irving K. Barber Library.jpg',
        'Rosegarden ubc.jpg',
        'Koerner Library UBC.jpg',
    ],
    'utrecht-university': [
        'Utrecht Academiegebouw.jpg',
        'David-de-Wied-gebouw Leuvenlaan-4 De-Uithof Utrecht Nederland.JPG',
        'Minnaertgebouw3.jpg',
    ],
    'rwth-aachen-university': [
        'RWTH Aachen Hauptgebäude.jpg',
        'AC BD RWTH Rogowski Institut.jpg',
        'RWTH-Hörsaalzentrum CARL.JPG',
    ],
    'esme': [
        'Campus Paris Ivry-sur-Seine ESME Sudria.jpg',
    ],
    'national-taiwan-university': [
        'National Taiwan University Library with sky.jpg',
        'NTU Royal Palm Boulevard 20140407.jpg',
        'NTU main gate 20201212.jpg',
    ],
    'waseda-university': [
        'Okuma lecture hall Waseda University 2007-02.jpg',
        'Okuma1.jpg',
        'Waseda University 2014.JPG',
    ],
    'university-of-calgary': [
        'Calgary, Canada April 2022 - University of Calgary 12.jpg',
        'Information and Communications Technology Building - University of Calgary - DSC00155.JPG',
        'Science B - University of Calgary - DSC00133.JPG',
    ],
    'dublin-city-university': [
        'DCU Glasnevin Library in 2009.jpg',
        'DCU Glasnevin Library.jpg',
        'The helix2.JPG',
    ],
    'rmit-university': [
        'Night Melbourne.jpg',
        'RMITSpiritualCentreCityCampus.jpg',
        'RMITEllisCourt.jpg',
    ],
    'tu-wien': [
        'Technische Universität Wien mainbuilding mainentrance northview.jpg',
        'Plus-Energie-Bürohochhaus TU Getreidemarkt.jpg',
        'Wien, Karlskirche und TU.jpg',
    ],
    'grenoble-inp-uga': [
        "Avenue Félix Viallet entre de l'INPG.jpg",
        "ENSIMAG - Saint-Martin-d'Hères.JPG",
        'Ensimag-campus-grenoble.jpg',
    ],
    'polytechnic-university-of-valencia': [
        'Caminosupv ETSICCP UPV edificio 4G.jpg',
        'Caminosupv ETSICCP UPV edificio 4Q.jpg',
    ],
}

# 위키데이터 값 중 그대로 쓰기 어려운 것
WEBSITE_FIX = {
    "maastricht-university": "https://www.maastrichtuniversity.nl/",  # 위키데이터는 네덜란드어 판(/nl)
    "osaka-university": "https://www.osaka-u.ac.jp/en",  # 위키데이터는 일본어 판(/ja)
}
# 학생 수가 10만을 넘으면 대학 체계 전체·온라인 과정을 합친 값이었다(UW–Madison 137,123 은 UW 체계 전체).
# 캠퍼스 하나의 학생 수로 보이지 않으므로 비운다.
MAX_STUDENTS = 100_000

TYPE_LABEL = {
    "Q875538": "국공립",  # public university
    "Q23002054": "사립",  # private not-for-profit educational institution
    "Q902104": "사립",  # private university
    "Q1371037": "공과대학",  # institute of technology
    "Q15936437": "연구중심",  # research university
}



def get_json(url: str, timeout: int = 25) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as resp:
        return json.loads(resp.read().decode("utf-8", "ignore"))


def api(host: str, **params) -> dict:
    params.setdefault("format", "json")
    return get_json(f"https://{host}/w/api.php?" + urllib.parse.urlencode(params))


def wikidata_id(title: str) -> str:
    pages = api("en.wikipedia.org", action="query", titles=title, prop="pageprops", redirects="1")["query"]["pages"]
    for page in pages.values():
        return page.get("pageprops", {}).get("wikibase_item", "")
    return ""


def claim_values(entity: dict, prop: str) -> list:
    out = []
    for c in entity.get("claims", {}).get(prop, []):
        if c.get("rank") == "deprecated":
            continue
        v = c.get("mainsnak", {}).get("datavalue", {}).get("value")
        if v is not None:
            out.append((c, v))
    # 우선(preferred) 표시가 있으면 그것부터
    out.sort(key=lambda cv: 0 if cv[0].get("rank") == "preferred" else 1)
    return out


def students(entity: dict) -> tuple[int, str]:
    best = (0, "")
    for c, v in claim_values(entity, "P2196"):
        try:
            n = int(float(str(v.get("amount", "0")).lstrip("+")))
        except ValueError:
            continue
        when = ""
        for q in c.get("qualifiers", {}).get("P585", []):
            when = q.get("datavalue", {}).get("value", {}).get("time", "")[1:5]
        if when >= best[1]:
            best = (n, when)
    return best


def kinds_from_description(text: str) -> list[str]:
    low = (text or "").lower()
    out = []
    if "private" in low:
        out.append("사립")
    elif any(w in low for w in ("public", "national", "autonomous", "state university")):
        out.append("국공립")
    if "research university" in low or "research institute" in low:  # 'education and research' 는 아님
        out.append("연구중심")
    if "technology" in low or "engineering" in low:
        out.append("공과대학")
    return out


def shrink(path: Path, width: int = 640) -> None:
    """앱에 묶이므로 줄인다. 720px 원본 110장이 22MB 였다."""
    try:
        from PIL import Image
    except ImportError:
        print("   (Pillow 없음 — 사진을 줄이지 않았다)")
        return
    im = Image.open(path).convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(path, "JPEG", quality=78, optimize=True, progressive=True)


def check_summer(url: str) -> str:
    """열리고, 최종 주소나 제목에 summer 가 들어 있으면 그 최종 주소."""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 " + UA})
    try:
        with urllib.request.urlopen(req, timeout=20, context=CTX) as resp:
            final = resp.geturl()
            head = resp.read(200_000).decode("utf-8", "ignore")
    except Exception as exc:
        print("   여름학기 주소 안 열림:", url, "-", str(exc)[:60])
        return ""
    title = re.search(r"<title[^>]*>(.*?)</title>", head, re.S | re.I)
    title = (title.group(1) if title else "").lower()
    if "summer" in final.lower() or "summer" in title:
        return final
    print("   여름학기 주소가 다른 곳으로 감:", final, "|", title[:60])
    return ""


def clean_author(text: str) -> str:
    """커먼스 Artist 칸은 틀(template)이 풀린 글이 섞여 온다. 이름만 남긴다 (실제로 본 꼴 세 가지)."""
    text = (text or "").strip()
    if "Carol M. Highsmith" in text:  # 'Public domainPublic domainfalse… This work is from the Carol M. Highsmith Archive'
        return "Carol M. Highsmith"
    m = re.search(r"belongs to (.+?)\.", text)  # 'This picture belongs to Xavier Caré. Please credit…'
    if m:
        return m.group(1).strip()
    m = re.search(r"No machine-readable author provided\. (\S+) assumed", text)
    if m:
        return m.group(1)
    return text.splitlines()[0].strip()[:80] if text else ""


def commons_file(file_name: str) -> dict:
    """커먼스 파일 하나의 720px 썸네일 주소와 작성자·라이선스."""
    data = api("commons.wikimedia.org", action="query", titles=f"File:{file_name}",
               prop="imageinfo", iiprop="url|extmetadata", iiurlwidth="720")
    strip = lambda s: re.sub(r"<[^>]+>", "", s or "").strip()
    for page in data.get("query", {}).get("pages", {}).values():
        info = (page.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata", {})
        return {
            "thumb": info.get("thumburl", ""),
            "fileName": file_name,
            "author": clean_author(strip(meta.get("Artist", {}).get("value"))),
            "license": strip(meta.get("LicenseShortName", {}).get("value"))[:60],
            "source": "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(file_name),
        }
    return {}


def download(url: str, dest: Path) -> bool:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=40, context=CTX) as resp:
            data = resp.read()
        if len(data) < 2000:
            return False
        dest.write_bytes(data)
        return True
    except Exception as exc:
        print("   내려받기 실패:", exc)
        return False


def main() -> int:
    only = set(sys.argv[1:])
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    meta: dict[str, dict] = json.loads(META_PATH.read_text(encoding="utf-8")) if META_PATH.exists() else {}
    meta = {k: v for k, v in meta.items() if k in {slug(n) for n in CURRENT}}

    for name, title in TITLES.items():
        key = slug(name)
        if (only and key not in only) or name not in CURRENT:
            continue
        print("조회:", name)
        try:
            qid = wikidata_id(title)
            ent = get_json(f"https://www.wikidata.org/wiki/Special:EntityData/{qid}.json")["entities"][qid] if qid else {}
        except Exception as exc:
            print("   위키데이터 실패:", exc)
            continue
        site = next((v for _, v in claim_values(ent, "P856")), "")
        founded = next((v.get("time", "")[1:5] for _, v in claim_values(ent, "P571")), "")
        n_students, n_when = students(ent)
        kinds = []
        for _, v in claim_values(ent, "P31"):
            label = TYPE_LABEL.get(v.get("id", ""))
            if label and label not in kinds:
                kinds.append(label)
        if "국공립" in kinds and "사립" in kinds:
            kinds.remove("사립")
        for label in kinds_from_description(ent.get("descriptions", {}).get("en", {}).get("value", "")):
            if label not in kinds:
                kinds.append(label)
        if "국공립" in kinds and "사립" in kinds:
            kinds.remove("사립")
        links = ent.get("sitelinks", {})
        ko_title = links.get("kowiki", {}).get("title", "")
        summer = check_summer(SUMMER[name]) if name in SUMMER else ""
        if not summer and SUMMER.get(name) in SUMMER_SEARCHED:
            summer = SUMMER[name]

        old = {p["fileName"]: p for p in meta.get(key, {}).get("photos", [])}
        photos = []
        for n, file_name in enumerate(PICKS.get(key, []), 1):
            dest = OUT_DIR / f"{key}-{n}.jpg"
            had = old.get(file_name)
            if had and had.get("file") == dest.name and dest.exists():
                photos.append(had)
                continue
            try:
                p = commons_file(file_name)
                if p.get("thumb") and download(p["thumb"], dest):
                    shrink(dest)
                    photos.append({"file": dest.name, **{k: p[k] for k in ("fileName", "author", "license", "source")}})
            except Exception as exc:
                print("   사진 실패:", file_name, exc)
            time.sleep(0.3)
        site = WEBSITE_FIX.get(key, site)
        if n_students > MAX_STUDENTS:
            n_students, n_when = 0, ""

        meta[key] = {
            "wikidata": qid,
            "koName": ent.get("labels", {}).get("ko", {}).get("value", ""),
            "website": site,
            "summer": summer,
            "founded": founded,
            "students": n_students,
            "studentsYear": n_when,
            "kinds": kinds,
            "wiki": f"https://ko.wikipedia.org/wiki/{urllib.parse.quote(ko_title.replace(' ', '_'))}" if ko_title
            else f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}",
            "photos": photos,
        }
        print(f"   {site or '-'} · 설립 {founded or '-'} · 학생 {n_students or '-'} · 여름 {'O' if summer else '-'} · 사진 {len(photos)}")
        time.sleep(0.4)

    META_PATH.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n끝. {len(meta)}곳")
    return 0


if __name__ == "__main__":
    sys.exit(main())
