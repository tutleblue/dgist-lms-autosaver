#!/bin/sh
# Daling 맥 판을 서명할 사설 코드 서명 인증서(.p12)를 한 번 만든다. 개인 키는 저장소 밖에만 둔다.
#
#   sh packaging/mac/make_sign_cert.sh [저장할 폴더]        (기본: ~/daling-mac-sign)
#   Windows 는 Git Bash 에서 (Git for Windows 에 openssl 이 들어 있다). 맥·리눅스는 터미널에서.
#   다른 openssl 을 쓰려면 OPENSSL=/경로/openssl sh …
#
# 왜 필요한가
#   ad-hoc 서명(codesign -s -)의 서명 요구 조건(designated requirement)은 'cdhash H"…"' 라 빌드마다 바뀐다.
#   macOS 는 개인정보 보호 권한(TCC: 문서 폴더 접근 등)과 키체인 허락을 이 조건에 묶어 두므로 업데이트마다 다시 묻는다.
#   같은 인증서로 서명하면 조건이 'identifier "app.daling.desktop" and certificate root = H"<인증서 SHA-1>"' 로 고정된다.
#   Gatekeeper 경고는 이걸로 없어지지 않는다(애플이 발급한 인증서 + 공증이어야 함). 그건 한 줄 설치가 피한다.
#
# 만든 뒤 (본인이 직접 — 비밀값은 다른 사람·도구가 대신 넣지 않는다)
#   GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret
#     MAC_SIGN_P12_BASE64    ← daling-mac-sign.p12.base64.txt 내용
#     MAC_SIGN_P12_PASSWORD  ← daling-mac-sign.p12.password.txt 내용
#   (gh 를 쓰면: gh secret set MAC_SIGN_P12_BASE64 < 파일, gh secret set MAC_SIGN_P12_PASSWORD < 파일)
#   폴더는 따로 백업하고 저장소·클라우드 공유 폴더에 두지 않는다. 잃어버리면 새로 만들면 되지만,
#   그 판부터 사용자가 키체인·권한을 한 번 다시 허락해야 한다 (인증서 SHA-1 이 조건에 들어 있으므로).
set -eu

OUT="${1:-$HOME/daling-mac-sign}"
OPENSSL="${OPENSSL:-openssl}"
# 인증서 이름(CN). 한글은 넣지 않는다 — security·codesign 출력과 CI 로그에서 깨지지 않게
NAME="Daling Mac Signing"
P12="$OUT/daling-mac-sign.p12"

if [ -e "$P12" ]; then
  echo "이미 있습니다: $P12"
  echo "새로 만들면 다음 판에서 사용자가 키체인·권한을 다시 허락해야 합니다. 정말 바꾸려면 그 폴더를 옮긴 뒤 다시 실행하세요."
  exit 1
fi
umask 077
mkdir -p "$OUT"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT INT TERM

# -subj "/CN=…" 는 Git Bash 가 경로로 바꿔 버린다(MSYS 경로 변환). 설정 파일로 넘긴다.
# CA:FALSE·digitalSignature·codeSigning: codesign 이 '코드 서명에 쓸 수 있는 인증서' 로 알아보는 최소 조건
cat > "$WORK/req.cnf" <<EOF
[req]
distinguished_name = dn
x509_extensions = ext
prompt = no
[dn]
CN = $NAME
O = Daling
[ext]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature
extendedKeyUsage = critical, codeSigning
subjectKeyIdentifier = hash
EOF

# 암호는 명령줄 대신 환경 변수로 (env:). 'file:경로' 도 Git Bash 가 경로를 바꿔 깨진다
DALING_P12_PASS="$("$OPENSSL" rand -hex 24)"
export DALING_P12_PASS
printf '%s' "$DALING_P12_PASS" > "$OUT/daling-mac-sign.p12.password.txt"

# 20년. 만료된 인증서로 서명한 앱은 검증이 틀어질 수 있어 넉넉히 둔다. 개인 키는 암호를 걸어 임시 폴더에만
"$OPENSSL" req -x509 -newkey rsa:2048 -sha256 -days 7300 -config "$WORK/req.cnf" \
  -keyout "$WORK/key.pem" -passout env:DALING_P12_PASS -out "$WORK/cert.pem"
# macOS 의 security import 는 OpenSSL 3 기본(AES-256·PBKDF2) .p12 를 못 읽는다 → 예전 방식(3DES·SHA-1 MAC)으로
"$OPENSSL" pkcs12 -export -name "$NAME" -inkey "$WORK/key.pem" -passin env:DALING_P12_PASS \
  -in "$WORK/cert.pem" -out "$P12" -passout env:DALING_P12_PASS \
  -keypbe PBE-SHA1-3DES -certpbe PBE-SHA1-3DES -macalg sha1
"$OPENSSL" base64 -A -in "$P12" -out "$OUT/daling-mac-sign.p12.base64.txt"
cp "$WORK/cert.pem" "$OUT/daling-mac-sign.cert.pem"   # 공개 인증서(비밀 아님). 서명 확인용

SHA1="$("$OPENSSL" x509 -in "$WORK/cert.pem" -noout -fingerprint -sha1 | sed 's/.*=//; s/://g')"
END="$("$OPENSSL" x509 -in "$WORK/cert.pem" -noout -enddate | sed 's/.*=//')"
echo
echo "만들었습니다: $OUT"
echo "  인증서 이름  $NAME"
echo "  SHA-1        $SHA1   (CI 로그의 designated requirement 에 이 값이 보여야 합니다)"
echo "  만료         $END"
echo
echo "GitHub 저장소 → Settings → Secrets and variables → Actions 에 직접 넣으세요:"
echo "  MAC_SIGN_P12_BASE64    ← $OUT/daling-mac-sign.p12.base64.txt"
echo "  MAC_SIGN_P12_PASSWORD  ← $OUT/daling-mac-sign.p12.password.txt"
echo "이 폴더는 백업하고, 저장소에는 넣지 마세요."
