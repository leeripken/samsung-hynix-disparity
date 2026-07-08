import json
import os
import sys

import requests

DATA_DIR = "data"
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")


def load(filename):
    with open(os.path.join(DATA_DIR, filename), encoding="utf-8") as f:
        return json.load(f)


def build_message():
    samsung = load("samsung.json")
    hynix = load("hynix.json")
    mdd = load("mdd.json")

    mdd_by_key = {s["key"]: s for s in mdd["stocks"]}

    lines = [f"\U0001F4CA 삼성전자 · SK하이닉스 업데이트 ({mdd['updated_at']})", ""]

    for disparity_data, key, name in (
        (samsung, "samsung", "삼성전자"),
        (hynix, "hynix", "SK하이닉스"),
    ):
        d = disparity_data["latest"]
        m = mdd_by_key[key]
        lines.append(f"[{name}]")
        lines.append(f"현재가: {d['close']:,}원")
        lines.append(f"이격도: {d['disparity']}% ({d['zone']})")
        lines.append(f"MDD(52주): {m['current_drawdown']}% ({m['current_zone']})")
        lines.append("")

    return "\n".join(lines).strip()


def send(message):
    if not BOT_TOKEN or not CHAT_ID:
        print("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 가 설정되지 않았습니다.")
        sys.exit(1)

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    res = requests.post(url, data={"chat_id": CHAT_ID, "text": message}, timeout=10)
    res.raise_for_status()
    print("텔레그램 전송 완료")


if __name__ == "__main__":
    send(build_message())
