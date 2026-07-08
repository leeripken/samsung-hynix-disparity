from pykrx import stock
import pandas as pd
import json
import os
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))


def build_data(ticker, name, filename):
    end_date = datetime.now(KST)
    start_date = end_date - timedelta(days=365 * 5)

    df = stock.get_market_ohlcv_by_date(
        start_date.strftime("%Y%m%d"),
        end_date.strftime("%Y%m%d"),
        ticker
    )

    df = df.reset_index()
    df["날짜"] = df["날짜"].astype(str)
    df["MA50"] = df["종가"].rolling(50).mean()
    df["disparity"] = (df["종가"] / df["MA50"]) * 100
    df = df.dropna().copy()

    latest = df.iloc[-1]
    prev = df.iloc[-2]

    def classify(v):
        if v >= 130:
            return "과열권"
        elif v >= 120:
           return "과열 경계"
        elif v >= 105:
           return "정상"
        else:
          return "과열 해소"

    payload = {
        "name": name,
        "ticker": ticker,
        "latest": {
            "date": latest["날짜"] + " " + end_date.strftime("%H:%M") + " KST",
            "close": int(latest["종가"]),
            "ma50": round(float(latest["MA50"]), 2),
            "disparity": round(float(latest["disparity"]), 2),
            "change_pct": round(((latest["종가"] / prev["종가"]) - 1) * 100, 2),
            "zone": classify(float(latest["disparity"]))
        },
        "history": [
            {
                "date": row["날짜"],
                "close": int(row["종가"]),
                "ma50": round(float(row["MA50"]), 2),
                "disparity": round(float(row["disparity"]), 2),
                "zone": classify(float(row["disparity"]))
            }
            for _, row in df.tail(60).iterrows()
        ],
    "chart": {
    "labels": df["날짜"].tolist(),
    "values": [round(float(x), 2) for x in df["disparity"].tolist()]
}
    }

    os.makedirs("data", exist_ok=True)

    with open(f"data/{filename}.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"data/{filename}.json 생성 완료")


# 삼성전자
build_data("005930", "삼성전자", "samsung")

# SK하이닉스
build_data("000660", "SK하이닉스", "hynix")