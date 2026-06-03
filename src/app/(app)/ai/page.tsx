import { cookies } from "next/headers";

import { Button } from "@/components/ui/button";
import { ModulePage } from "@/components/shared/module-page";
import { LOCALE_COOKIE, normalizeLocale, localizedValue } from "@/lib/i18n";

export default async function AiPage() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value ?? null);

  return (
    <ModulePage
      locale={locale}
      eyebrow={localizedValue(locale, { en: "AI tools", he: "כלי AI" })}
      title={localizedValue(locale, {
        en: "Future-ready AI workspace for planning and recommendations",
        he: "מרחב AI מוכן לעתיד עבור תכנון והמלצות",
      })}
      description={localizedValue(locale, {
        en: "Reserve a module boundary now so OpenAI-powered planning can be added later without reworking the core system.",
        he: "שמור כבר עכשיו גבול מודולרי כדי שאפשר יהיה להוסיף בהמשך תכנון מבוסס OpenAI בלי לשכתב את ליבת המערכת.",
      })}
      highlights={[
        localizedValue(locale, { en: "Room layout and floor planning suggestions.", he: "הצעות לסידור חללים ותכנון קומה." }),
        localizedValue(locale, { en: "Electrical, plumbing, and material recommendations.", he: "המלצות לחשמל, אינסטלציה וחומרים." }),
        localizedValue(locale, { en: "Interior style assistance and assistant chat surfaces.", he: "סיוע בסגנון עיצוב פנים ומשטחי שיחה עם עוזר." }),
        localizedValue(locale, { en: "Separation of AI contracts from core business operations.", he: "הפרדה בין חוזי AI לבין התפעול העסקי המרכזי." }),
      ]}
      roadmap={[
        localizedValue(locale, { en: "Define AI request/response contracts in a dedicated layer.", he: "להגדיר חוזי בקשה/תגובה של AI בשכבה ייעודית." }),
        localizedValue(locale, { en: "Store prompts, usage, and audit logs separately from business data.", he: "לשמור פרומפטים, שימוש ולוגי ביקורת בנפרד מנתוני העסק." }),
        localizedValue(locale, { en: "Add project-aware assistants and recommendation workflows.", he: "להוסיף עוזרים מודעי-פרויקט וזרימות המלצה." }),
        localizedValue(locale, { en: "Connect to OpenAI or similar providers behind a service boundary.", he: "להתחבר ל-OpenAI או לספקים דומים מאחורי שכבת שירות." }),
      ]}
      action={<Button variant="secondary">{localizedValue(locale, { en: "Preview AI roadmap", he: "תצוגה מקדימה של מפת ה-AI" })}</Button>}
    />
  );
}