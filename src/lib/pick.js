/**
 * Dagens forslag. Skal være det samme hele dagen — ellers er det ikke et
 * forslag, det er en terning — og skal skifte når dagen gør.
 *
 * Datoen er nøglen, så alle i huset ser det samme forslag. At listen ændrer
 * sig når man filtrerer er med vilje: forslaget skal komme fra det man
 * faktisk kigger på.
 */
export function pickOfTheDay(items, date = new Date()) {
  if (items.length === 0) return null
  const key =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
  return items[key % items.length]
}
