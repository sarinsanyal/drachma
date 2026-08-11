export function getMarketStatus() {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        timeZoneName: "shortOffset",
    });
    const part = fmt.formatToParts(now).find((p) => p.type === "timeZoneName")?.value || "GMT-5";
    const match = part.match(/GMT([+-]\d+)/);
    const offsetHours = match ? parseInt(match[1], 10) : -5;

    const etParts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
        hour12: false, weekday: "short",
    }).formatToParts(now);

    const get = (type: string) => etParts.find((p) => p.type === type)?.value || "";
    const weekday = get("weekday");
    const hour = Number(get("hour"));
    const minute = Number(get("minute"));
    const year = Number(get("year"));
    const month = Number(get("month"));
    const day = Number(get("day"));

    const isWeekday = weekday !== "Sat" && weekday !== "Sun";
    const minutesNow = hour * 60 + minute;
    const isOpen = isWeekday && minutesNow >= 9 * 60 + 30 && minutesNow < 16 * 60;

    const openUTC = new Date(Date.UTC(year, month - 1, day, 9 - offsetHours, 30));
    const closeUTC = new Date(Date.UTC(year, month - 1, day, 16 - offsetHours, 0));

    return { isOpen, openUTC, closeUTC, isWeekday };
}