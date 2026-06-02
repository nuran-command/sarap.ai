import re
from dataclasses import dataclass


@dataclass(frozen=True)
class ReviewAnalysis:
    sentiment: str
    category: str
    urgency: str
    language: str
    summary: str


CATEGORY_KEYWORDS: dict[str, tuple[str, ...]] = {
    "waiting_time": (
        "ждали",
        "долго",
        "ожидание",
        "очередь",
        "медленно",
        "slow",
        "wait",
        "күттік",
        "ұзақ",
    ),
    "food_quality": (
        "еда",
        "блюдо",
        "вкус",
        "холодн",
        "пересол",
        "сырой",
        "food",
        "taste",
        "meal",
        "тағам",
    ),
    "staff_behavior": (
        "официант",
        "персонал",
        "груб",
        "хам",
        "администратор",
        "staff",
        "service",
        "қызмет",
    ),
    "cleanliness": (
        "гряз",
        "чист",
        "санитар",
        "туалет",
        "clean",
        "dirty",
        "таза",
    ),
    "delivery_issue": (
        "доставка",
        "курьер",
        "привезли",
        "delivery",
        "жеткізу",
    ),
    "price_value": (
        "цена",
        "дорого",
        "счет",
        "price",
        "expensive",
        "баға",
        "қымбат",
    ),
    "atmosphere": (
        "атмосфера",
        "музыка",
        "шум",
        "интерьер",
        "ambience",
        "атмосфера",
    ),
    "reservation": (
        "бронь",
        "резерв",
        "столик",
        "reservation",
        "booked",
    ),
}

NEGATIVE_WORDS = (
    "плохо",
    "ужас",
    "разочар",
    "не понрав",
    "груб",
    "хам",
    "гряз",
    "долго",
    "cold",
    "bad",
    "terrible",
    "dirty",
    "slow",
)
POSITIVE_WORDS = ("отлично", "вкусно", "спасибо", "понрав", "good", "great", "excellent", "рахмет")
CRITICAL_WORDS = (
    "отрав",
    "антисанитар",
    "скандал",
    "никогда",
    "poison",
    "unsafe",
    "discrimination",
)


def detect_language(text: str) -> str:
    lowered = text.lower()
    if re.search(r"[әғқңөұүі]", lowered):
        return "kk"
    if re.search(r"[а-яё]", lowered):
        return "ru"
    if re.search(r"[a-z]", lowered):
        return "en"
    return "other"


def classify_category(text: str) -> str:
    lowered = text.lower()
    scores = {
        category: sum(1 for keyword in keywords if keyword in lowered)
        for category, keywords in CATEGORY_KEYWORDS.items()
    }
    best_category, best_score = max(scores.items(), key=lambda item: item[1])
    return best_category if best_score > 0 else "other"


def classify_sentiment(rating: int, text: str) -> str:
    lowered = text.lower()
    if rating <= 2 or any(word in lowered for word in NEGATIVE_WORDS):
        return "negative"
    if rating >= 4 and any(word in lowered for word in POSITIVE_WORDS):
        return "positive"
    if rating >= 4:
        return "positive"
    return "neutral"


def classify_urgency(rating: int, text: str, sentiment: str, category: str) -> str:
    lowered = text.lower()
    if rating <= 1 or any(word in lowered for word in CRITICAL_WORDS):
        return "critical"
    if rating <= 2 and category in {"staff_behavior", "cleanliness", "waiting_time", "food_quality"}:
        return "high"
    if sentiment == "negative":
        return "medium"
    return "low"


def summarize_review(sentiment: str, category: str, urgency: str) -> str:
    category_labels = {
        "waiting_time": "long waiting time",
        "food_quality": "food quality",
        "staff_behavior": "staff behavior",
        "cleanliness": "cleanliness",
        "delivery_issue": "delivery issue",
        "price_value": "price/value",
        "atmosphere": "atmosphere",
        "reservation": "reservation",
        "other": "general experience",
    }
    return f"{sentiment.title()} review about {category_labels.get(category, category)}. Urgency: {urgency}."


def analyze_review(text: str, rating: int) -> ReviewAnalysis:
    language = detect_language(text)
    category = classify_category(text)
    sentiment = classify_sentiment(rating, text)
    urgency = classify_urgency(rating, text, sentiment, category)
    summary = summarize_review(sentiment, category, urgency)
    return ReviewAnalysis(
        sentiment=sentiment,
        category=category,
        urgency=urgency,
        language=language,
        summary=summary,
    )


def generate_reply(text: str, rating: int, category: str, language: str = "ru", tone: str = "warm") -> str:
    if language == "kk":
        return _generate_kazakh_reply(category, tone)
    return _generate_russian_reply(category, tone, rating)


def _generate_russian_reply(category: str, tone: str, rating: int) -> str:
    issue_labels = {
        "waiting_time": "долгое ожидание",
        "food_quality": "качество блюда",
        "staff_behavior": "работу персонала",
        "cleanliness": "чистоту",
        "delivery_issue": "доставку",
        "price_value": "соотношение цены и качества",
        "atmosphere": "атмосферу",
        "reservation": "бронирование",
        "other": "ваш опыт",
    }
    issue = issue_labels.get(category, "ваш опыт")
    if rating >= 4:
        return "Спасибо за отзыв и высокую оценку. Нам важно видеть, что гости остаются довольны. Будем рады видеть вас снова."
    if tone == "short":
        return f"Спасибо за отзыв. Нам жаль, что {issue} оставили такое впечатление. Передадим комментарий команде и проверим ситуацию."
    if tone == "formal":
        return f"Благодарим за обратную связь. Сожалеем, что {issue} не соответствовали вашим ожиданиям. Мы внимательно разберем ситуацию с командой."
    if tone == "apologetic":
        return f"Спасибо, что написали нам. Нам искренне жаль, что {issue} испортили ваш визит. Мы передадим отзыв ответственным и проверим, что произошло."
    return f"Спасибо за честный отзыв. Нам жаль, что {issue} оставили неприятное впечатление. Мы обсудим ситуацию с командой и постараемся улучшить этот момент."


def _generate_kazakh_reply(category: str, tone: str) -> str:
    issue_labels = {
        "waiting_time": "ұзақ күту",
        "food_quality": "тағам сапасы",
        "staff_behavior": "қызмет көрсету",
        "cleanliness": "тазалық",
        "delivery_issue": "жеткізу",
        "price_value": "баға мен сапа арақатынасы",
        "atmosphere": "атмосфера",
        "reservation": "брондау",
        "other": "сіздің тәжірибеңіз",
    }
    issue = issue_labels.get(category, "сіздің тәжірибеңіз")
    if tone == "short":
        return f"Пікіріңізге рахмет. {issue} бойынша әсеріңіз көңіліңізден шықпағанына өкінеміз. Бұл жағдайды командамен тексереміз."
    return f"Пікіріңізге рахмет. {issue} сізде жағымсыз әсер қалдырғанына өкінеміз. Ескертуіңізді командаға жеткізіп, жағдайды мұқият қараймыз."

