from pykrx import stock
from datetime import datetime, timedelta, timezone
import pandas as pd
import json
import os


KST = timezone(timedelta(hours=9))
now_kst = datetime.now(KST)

UPDATED_AT = now_kst.strftime("%Y-%m-%d %H:%M KST")
UPDATED_DATE = now_kst.strftime("%Y-%m-%d")
UPDATED_TIME = now_kst.strftime("%H:%M")
VERSION_LABEL = UPDATED_AT


TICKERS = {
    "samsung": {
        "code": "005930",
        "name": "삼성전자",
        "zone_type": "kospi"
    },
    "hynix": {
        "code": "000660",
        "name": "SK하이닉스",
        "zone_type": "kospi"
    }
}


END_DATE = now_kst
START_DATE = END_DATE - timedelta(days=365 * 6)

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)


def get_zone(drawdown, zone_type):
    if zone_type == "kosdaq":
        if drawdown <= -20:
            return "경계"
        elif drawdown <= -14:
            return "조정"
        elif drawdown <= -9:
            return "관심"
        else:
            return "정상"
    else:
        if drawdown <= -15:
            return "경계"
        elif drawdown <= -10:
            return "조정"
        elif drawdown <= -5:
            return "관심"
        else:
            return "정상"


def build_stock_mdd(code, name, zone_type, key):
    df = stock.get_market_ohlcv_by_date(
        START_DATE.strftime("%Y%m%d"),
        END_DATE.strftime("%Y%m%d"),
        code
    ).reset_index()

    df = df.rename(columns={"날짜": "date", "종가": "close"})
    df["date"] = pd.to_datetime(df["date"])
    df = df[["date", "close"]].copy()

    df["all_time_peak"] = df["close"].cummax()
    df["drawdown_all"] = ((df["close"] / df["all_time_peak"]) - 1) * 100

    df["peak_52w"] = df["close"].rolling(window=252, min_periods=1).max()
    df["drawdown_52w"] = ((df["close"] / df["peak_52w"]) - 1) * 100

    df["drawdown_52w"] = df["drawdown_52w"].round(1)
    df["drawdown_all"] = df["drawdown_all"].round(1)

    latest = df.iloc[-1]
    current_drawdown = round(float(latest["drawdown_52w"]), 1)
    mdd_52w = round(float(df["drawdown_52w"].min()), 1)
    mdd_all = round(float(df["drawdown_all"].min()), 1)

    latest_close = int(latest["close"])
    high_52w_price = int(latest["peak_52w"])
    high_52w_drawdown = round(float(latest["drawdown_52w"]), 1)

    chart_df = df.tail(1260).copy()

    history_df = df.tail(40).copy().sort_values("date", ascending=False)

    history = []
    for _, row in history_df.iterrows():
        dd = round(float(row["drawdown_52w"]), 1)
        history.append({
            "date": row["date"].strftime("%Y-%m-%d"),
            "drawdown": dd,
            "zone": get_zone(dd, zone_type)
        })

    result = {
        "key": key,
        "name": name,
        "ticker": code,
        "updated_at": UPDATED_AT,
        "updated_date": UPDATED_DATE,
        "updated_time": UPDATED_TIME,
        "version_label": VERSION_LABEL,
        "zone_type": zone_type,
        "current_drawdown": current_drawdown,
        "current_zone": get_zone(current_drawdown, zone_type),
        "mdd_52w": mdd_52w,
        "mdd_all": mdd_all,
        "current_price": latest_close,
        "high_52w_price": high_52w_price,
        "high_52w_drawdown": high_52w_drawdown,
        "chart": {
            "labels": chart_df["date"].dt.strftime("%Y-%m-%d").tolist(),
            "values": [round(float(x), 1) for x in chart_df["drawdown_52w"].tolist()]
        },
        "history": history
    }

    return result


def align_histories(stocks):
    samsung = next(s for s in stocks if s["key"] == "samsung")
    hynix = next(s for s in stocks if s["key"] == "hynix")

    samsung_dates = {row["date"] for row in samsung["history"]}
    hynix_dates = {row["date"] for row in hynix["history"]}
    common_dates = sorted(list(samsung_dates & hynix_dates), reverse=True)

    samsung["history"] = [row for row in samsung["history"] if row["date"] in common_dates]
    hynix["history"] = [row for row in hynix["history"] if row["date"] in common_dates]

    samsung["history"] = sorted(samsung["history"], key=lambda x: x["date"], reverse=True)
    hynix["history"] = sorted(hynix["history"], key=lambda x: x["date"], reverse=True)

    return [samsung, hynix]


def main():
    samsung = build_stock_mdd(
        TICKERS["samsung"]["code"],
        TICKERS["samsung"]["name"],
        TICKERS["samsung"]["zone_type"],
        "samsung"
    )

    hynix = build_stock_mdd(
        TICKERS["hynix"]["code"],
        TICKERS["hynix"]["name"],
        TICKERS["hynix"]["zone_type"],
        "hynix"
    )

    stocks = align_histories([samsung, hynix])

    merged = {
        "updated_at": UPDATED_AT,
        "updated_date": UPDATED_DATE,
        "updated_time": UPDATED_TIME,
        "version_label": VERSION_LABEL,
        "stocks": stocks
    }

    with open(os.path.join(DATA_DIR, "samsung_mdd.json"), "w", encoding="utf-8") as f:
        json.dump(samsung, f, ensure_ascii=False, indent=2)

    with open(os.path.join(DATA_DIR, "hynix_mdd.json"), "w", encoding="utf-8") as f:
        json.dump(hynix, f, ensure_ascii=False, indent=2)

    with open(os.path.join(DATA_DIR, "mdd.json"), "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    print("MDD JSON 생성 완료:")
    print("- data/samsung_mdd.json")
    print("- data/hynix_mdd.json")
    print("- data/mdd.json")
    print(f"- version: {VERSION_LABEL}")


if __name__ == "__main__":
    main()