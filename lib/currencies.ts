// Currency list for the catalog currency selector. Codes are ISO 4217; symbols
// are derived at runtime via Intl so we don't hardcode them. The most commonly
// used currencies are listed first; the rest follow alphabetically by name so
// the searchable picker can still surface anything (broad African coverage
// included).
export type Currency = { code: string; name: string };

const POPULAR: Currency[] = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "INR", name: "Indian Rupee" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "ZAR", name: "South African Rand" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "GHS", name: "Ghanaian Cedi" },
];

const OTHERS: Currency[] = [
  { code: "DZD", name: "Algerian Dinar" },
  { code: "AOA", name: "Angolan Kwanza" },
  { code: "ARS", name: "Argentine Peso" },
  { code: "AMD", name: "Armenian Dram" },
  { code: "AZN", name: "Azerbaijani Manat" },
  { code: "BHD", name: "Bahraini Dinar" },
  { code: "BDT", name: "Bangladeshi Taka" },
  { code: "BBD", name: "Barbadian Dollar" },
  { code: "BYN", name: "Belarusian Ruble" },
  { code: "BZD", name: "Belize Dollar" },
  { code: "BMD", name: "Bermudian Dollar" },
  { code: "BTN", name: "Bhutanese Ngultrum" },
  { code: "BOB", name: "Bolivian Boliviano" },
  { code: "BAM", name: "Bosnia-Herzegovina Convertible Mark" },
  { code: "BWP", name: "Botswana Pula" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "BND", name: "Brunei Dollar" },
  { code: "BGN", name: "Bulgarian Lev" },
  { code: "BIF", name: "Burundian Franc" },
  { code: "KHR", name: "Cambodian Riel" },
  { code: "CVE", name: "Cape Verdean Escudo" },
  { code: "XAF", name: "Central African CFA Franc" },
  { code: "XOF", name: "West African CFA Franc" },
  { code: "CLP", name: "Chilean Peso" },
  { code: "COP", name: "Colombian Peso" },
  { code: "KMF", name: "Comorian Franc" },
  { code: "CDF", name: "Congolese Franc" },
  { code: "CRC", name: "Costa Rican Colón" },
  { code: "CUP", name: "Cuban Peso" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "DKK", name: "Danish Krone" },
  { code: "DJF", name: "Djiboutian Franc" },
  { code: "DOP", name: "Dominican Peso" },
  { code: "XCD", name: "East Caribbean Dollar" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "ERN", name: "Eritrean Nakfa" },
  { code: "ETB", name: "Ethiopian Birr" },
  { code: "FJD", name: "Fijian Dollar" },
  { code: "GMD", name: "Gambian Dalasi" },
  { code: "GEL", name: "Georgian Lari" },
  { code: "GTQ", name: "Guatemalan Quetzal" },
  { code: "GNF", name: "Guinean Franc" },
  { code: "GYD", name: "Guyanaese Dollar" },
  { code: "HTG", name: "Haitian Gourde" },
  { code: "HNL", name: "Honduran Lempira" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "HUF", name: "Hungarian Forint" },
  { code: "ISK", name: "Icelandic Króna" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "IRR", name: "Iranian Rial" },
  { code: "IQD", name: "Iraqi Dinar" },
  { code: "ILS", name: "Israeli New Shekel" },
  { code: "JMD", name: "Jamaican Dollar" },
  { code: "JOD", name: "Jordanian Dinar" },
  { code: "KZT", name: "Kazakhstani Tenge" },
  { code: "KWD", name: "Kuwaiti Dinar" },
  { code: "KGS", name: "Kyrgystani Som" },
  { code: "LAK", name: "Laotian Kip" },
  { code: "LBP", name: "Lebanese Pound" },
  { code: "LSL", name: "Lesotho Loti" },
  { code: "LRD", name: "Liberian Dollar" },
  { code: "LYD", name: "Libyan Dinar" },
  { code: "MOP", name: "Macanese Pataca" },
  { code: "MKD", name: "Macedonian Denar" },
  { code: "MGA", name: "Malagasy Ariary" },
  { code: "MWK", name: "Malawian Kwacha" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "MVR", name: "Maldivian Rufiyaa" },
  { code: "MRU", name: "Mauritanian Ouguiya" },
  { code: "MUR", name: "Mauritian Rupee" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "MDL", name: "Moldovan Leu" },
  { code: "MNT", name: "Mongolian Tugrik" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "MZN", name: "Mozambican Metical" },
  { code: "MMK", name: "Myanmar Kyat" },
  { code: "NAD", name: "Namibian Dollar" },
  { code: "NPR", name: "Nepalese Rupee" },
  { code: "ANG", name: "Netherlands Antillean Guilder" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "NIO", name: "Nicaraguan Córdoba" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "OMR", name: "Omani Rial" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "PAB", name: "Panamanian Balboa" },
  { code: "PGK", name: "Papua New Guinean Kina" },
  { code: "PYG", name: "Paraguayan Guarani" },
  { code: "PEN", name: "Peruvian Sol" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "QAR", name: "Qatari Rial" },
  { code: "RON", name: "Romanian Leu" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "RWF", name: "Rwandan Franc" },
  { code: "WST", name: "Samoan Tala" },
  { code: "STN", name: "São Tomé & Príncipe Dobra" },
  { code: "RSD", name: "Serbian Dinar" },
  { code: "SCR", name: "Seychellois Rupee" },
  { code: "SLE", name: "Sierra Leonean Leone" },
  { code: "SOS", name: "Somali Shilling" },
  { code: "SSP", name: "South Sudanese Pound" },
  { code: "KRW", name: "South Korean Won" },
  { code: "LKR", name: "Sri Lankan Rupee" },
  { code: "SDG", name: "Sudanese Pound" },
  { code: "SRD", name: "Surinamese Dollar" },
  { code: "SZL", name: "Swazi Lilangeni" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "TWD", name: "New Taiwan Dollar" },
  { code: "TJS", name: "Tajikistani Somoni" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "THB", name: "Thai Baht" },
  { code: "TOP", name: "Tongan Paʻanga" },
  { code: "TTD", name: "Trinidad & Tobago Dollar" },
  { code: "TND", name: "Tunisian Dinar" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "TMT", name: "Turkmenistani Manat" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "UAH", name: "Ukrainian Hryvnia" },
  { code: "UYU", name: "Uruguayan Peso" },
  { code: "UZS", name: "Uzbekistani Som" },
  { code: "VUV", name: "Vanuatu Vatu" },
  { code: "VND", name: "Vietnamese Dong" },
  { code: "YER", name: "Yemeni Rial" },
  { code: "ZMW", name: "Zambian Kwacha" },
  { code: "ZWL", name: "Zimbabwean Dollar" },
];

export const CURRENCIES: Currency[] = [...POPULAR, ...OTHERS];

const BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

export function getCurrency(code: string | null | undefined): Currency | null {
  if (!code) return null;
  return BY_CODE.get(code.toUpperCase()) ?? null;
}

export function isValidCurrencyCode(value: unknown): value is string {
  return typeof value === "string" && BY_CODE.has(value.toUpperCase());
}

// Returns the narrow symbol for a currency (e.g. "₱", "$"), falling back to the
// code itself if the runtime can't resolve a symbol.
export function getCurrencySymbol(code: string): string {
  try {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}
