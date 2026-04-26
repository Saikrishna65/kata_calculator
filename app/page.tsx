"use client";
import React, { useState, useMemo, useRef } from "react";

/* ---------------- UTIL FUNCTIONS ---------------- */

// Indian number format with decimals
const formatIndianNumber = (num: number): string => {
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Format input (integer typing only)
const formatInput = (value: string) => {
  const cleaned = value.replace(/,/g, "");
  if (!cleaned) return "";

  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return "";

  return num.toLocaleString("en-IN");
};

const parseNumber = (value: string): number | null => {
  if (!value) return null;
  const num = Number(value.replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
};

/* ----------- RUPEES TO WORDS WITH PAISE ----------- */

const numberToRupeesWords = (num: number): string => {
  if (num === 0) return "Zero Rupees Only";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const getTwoDigits = (n: number): string => {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  };

  const getThreeDigits = (n: number): string => {
    if (n < 100) return getTwoDigits(n);
    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 ? " " + getTwoDigits(n % 100) : "")
    );
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let n = integerPart;
  let result = "";

  const crore = Math.floor(n / 10000000);
  n %= 10000000;

  const lakh = Math.floor(n / 100000);
  n %= 100000;

  const thousand = Math.floor(n / 1000);
  n %= 1000;

  const hundred = n;

  if (crore) result += getTwoDigits(crore) + " Crore ";
  if (lakh) result += getTwoDigits(lakh) + " Lakh ";
  if (thousand) result += getTwoDigits(thousand) + " Thousand ";
  if (hundred) result += getThreeDigits(hundred);

  result = result.trim() + " Rupees";

  if (decimalPart > 0) {
    result += " and " + getTwoDigits(decimalPart) + " Paise";
  }

  return result + " Only";
};

/* ---------------- TYPES ---------------- */

type Entry = {
  amount: number;
  kg: number;
  oneKg: number;
  value: number;
  isEditing?: boolean;
};

/* ---------------- COMPONENT ---------------- */

export default function Page() {
  const [amountInput, setAmountInput] = useState("");
  const [kgInput, setKgInput] = useState("");

  const [mode, setMode] = useState<"normal" | "book">("normal");

  const [entries, setEntries] = useState<Entry[]>([]);
  const [bookTotal, setBookTotal] = useState<number | null>(null);

  const kgRef = useRef<HTMLInputElement>(null);

  const amount = useMemo(() => parseNumber(amountInput), [amountInput]);
  const kg = useMemo(() => parseNumber(kgInput), [kgInput]);

  /* ---------------- DERIVED VALUES (UNCHANGED LOGIC) ---------------- */

  const oneKg = useMemo(() => {
    if (amount === null) return null;
    return amount / 80;
  }, [amount]);

  const value = useMemo(() => {
    if (oneKg === null || kg === null) return null;
    return oneKg * kg;
  }, [oneKg, kg]);

  /* ---------------- YOUR ORIGINAL WORD FUNCTIONS (UNCHANGED) ---------------- */

  const amountWords = useMemo(
    () => (amount !== null ? numberToRupeesWords(amount) : ""),
    [amount],
  );

  const kgWords = useMemo(
    () => (kg !== null ? numberToRupeesWords(kg) : ""),
    [kg],
  );

  /* ---------------- HANDLERS ---------------- */

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "");
    if (raw && !/^\d*$/.test(raw)) return;
    setAmountInput(formatInput(raw));
  };

  const handleKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "");
    if (raw && !/^\d*$/.test(raw)) return;
    setKgInput(formatInput(raw));
  };

  const handleClear = () => {
    setAmountInput("");
    setKgInput("");
  };

  /* ---------------- BOOK MODE LOGIC ---------------- */

  const handleAdd = () => {
    if (amount === null || kg === null || oneKg === null || value === null)
      return;

    const newEntry: Entry = {
      amount,
      kg,
      oneKg,
      value,
    };

    setEntries((prev) => [...prev, newEntry]);
    handleClear();
  };

  const handleAddAll = () => {
    const total = entries.reduce((sum, e) => sum + e.value, 0);
    setBookTotal(total);
  };

  const toggleEdit = (index: number) => {
    setEntries((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, isEditing: !item.isEditing } : item,
      ),
    );
  };

  const updateEntry = (index: number, field: "amount" | "kg", val: string) => {
    const cleaned = val.replace(/,/g, "");
    if (cleaned && !/^\d*$/.test(cleaned)) return;

    setEntries((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const updatedAmount =
          field === "amount"
            ? (parseNumber(cleaned) ?? item.amount)
            : item.amount;

        const updatedKg =
          field === "kg" ? (parseNumber(cleaned) ?? item.kg) : item.kg;

        const oneKg = updatedAmount / 80;
        const value = oneKg * updatedKg;

        return {
          ...item,
          amount: updatedAmount,
          kg: updatedKg,
          oneKg,
          value,
        };
      }),
    );
  };

  const switchMode = () => {
    setMode((prev) => (prev === "normal" ? "book" : "normal"));

    // reset book mode when switching back
    setEntries([]);
    setBookTotal(null);
  };

  const finalValue = mode === "book" && bookTotal !== null ? bookTotal : value;

  /* ---------------- UI ---------------- */

  return (
    <div className="w-full max-w-xl mx-auto p-6 space-y-10">
      {/* MODE SWITCH */}
      <button
        onClick={switchMode}
        className={`border-2 text-lg font-semibold px-3 rounded-lg py-1 transition transform active:scale-95 ${
          mode === "normal"
            ? "border-red-500 text-red-600 bg-transparent"
            : "border-red-700 bg-red-600 text-white"
        }`}
      >
        {mode === "normal" ? "Book" : "Normal"}
      </button>

      {/* RESULT */}
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-bold text-green-600">
          ₹ {finalValue !== null ? formatIndianNumber(finalValue) : "--"}
        </h1>

        <p className="text-lg text-gray-600">
          {oneKg !== null && `1 Kg = ₹ ${formatIndianNumber(oneKg)}`}
        </p>
      </div>

      {/* INPUTS */}
      <div className="space-y-5">
        {/* Amount */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Amount ₹</h2>
          <input
            type="text"
            inputMode="numeric"
            value={amountInput}
            onChange={handleAmountChange}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === "Enter") kgRef.current?.focus();
            }}
            className="w-full border-2 px-4 py-2 rounded-xl"
          />
          <p className="text-gray-600 mt-1">{amountWords}</p>
        </div>

        {/* KG */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Kg</h2>
          <input
            ref={kgRef}
            type="text"
            inputMode="numeric"
            value={kgInput}
            onChange={handleKgChange}
            onFocus={(e) => e.target.select()}
            className="w-full border-2 px-4 py-2 rounded-xl"
          />
          <p className="text-gray-600 mt-1">{kgWords}</p>
        </div>

        {/* BUTTONS */}
        <div className="space-y-3 pt-4">
          {mode === "normal" ? (
            <button
              onClick={handleClear}
              className="w-full bg-red-500 text-white py-2 rounded-xl"
            >
              Clear All
            </button>
          ) : (
            <>
              <button
                onClick={handleAdd}
                className="w-full bg-green-500 text-white py-2 rounded-xl"
              >
                Add Entry
              </button>
            </>
          )}
        </div>
      </div>

      {/* BOOK LIST */}
      {/* BOOK LIST */}
      {mode === "book" && (
        <div className="pt-6 space-y-4">
          <h2 className="text-xl font-semibold">Saved Entries</h2>

          {/* Entries */}
          {entries.map((e, i) => (
            <div key={i} className="border p-3 rounded-lg space-y-2">
              {/* VIEW MODE */}
              {!e.isEditing ? (
                <>
                  <div className="flex justify-between">
                    <div>
                      ₹ {formatIndianNumber(e.amount)} | {e.kg} Kg
                    </div>
                    <div className="text-green-600 font-semibold">
                      ₹ {formatIndianNumber(e.value)}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    1 Kg = ₹ {formatIndianNumber(e.oneKg)}
                  </div>

                  <button
                    onClick={() => toggleEdit(i)}
                    className="text-blue-500 text-sm underline"
                  >
                    Edit
                  </button>
                </>
              ) : (
                /* EDIT MODE */
                <div className="space-y-2">
                  <input
                    value={formatIndianNumber(e.amount)}
                    onChange={(ev) => updateEntry(i, "amount", ev.target.value)}
                    className="w-full border px-2 py-1 rounded"
                  />

                  <input
                    value={e.kg}
                    onChange={(ev) => updateEntry(i, "kg", ev.target.value)}
                    className="w-full border px-2 py-1 rounded"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleEdit(i)}
                      className="bg-green-500 text-white px-3 py-1 rounded"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* ADD ALL BUTTON AT BOTTOM */}
          {entries.length > 0 && (
            <button
              onClick={handleAddAll}
              className="w-full bg-blue-500 text-white py-2 rounded-xl active:scale-95 transition transform"
            >
              Add All
            </button>
          )}
        </div>
      )}
    </div>
  );
}
