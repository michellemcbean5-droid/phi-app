// A rotating library of practical reminders for owner-operators — surfaced on the
// Dashboard so drivers don't have to remember everything themselves.

export const DRIVER_TIPS: string[] = [
  'Under the 34-hour restart rule, you need at least 34 consecutive hours off duty to reset your weekly 60/70-hour clock.',
  'Keep your IFTA mileage log updated as you go — reconstructing quarterly fuel tax records from memory costs real money.',
  'Detention pay: most brokers owe you after 2 hours of free time at a shipper/receiver. Always log your check-in and check-out times.',
  'Fuel is usually your biggest expense. Fill up in the state with the lowest total (price + tax), not just the lowest sticker price.',
  'Photograph your Bill of Lading and trailer seal number before you drive off — it is your best defense against a shortage or damage claim.',
  'Rate confirmations should always match your dispatch — never run a load without one in hand.',
  'A CAT scale ticket costs a few dollars and can save you a $500+ overweight fine. When in doubt, weigh it.',
  'Preventive maintenance (oil, tires, brakes) is cheaper than a roadside breakdown that costs you a full day of revenue.',
  'Track your cost-per-mile weekly, not just per load — it is the number that tells you if you are actually profitable.',
  'Keep your ELD logs edited and certified daily — an audit looks much worse with a stack of unedited days.',
  'Ask for detention and layover pay in writing before you accept a load with a tight or unusual appointment window.',
  'A pre-trip inspection every day is not just a DOT rule — it is the cheapest insurance policy you have against a roadside breakdown.',
  'Set aside roughly 25-30% of every load\'s revenue for fuel, and don\'t let it get spent on anything else.',
  'When negotiating a rate, always quote per-mile plus fuel surcharge, not a flat number — it protects you when fuel prices move.',
  'Renew your IRP, IFTA, and permits before they lapse — a lapsed permit can shut a loaded truck down at a scale.',
];

export const getTipOfTheDay = (): string => {
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  return DRIVER_TIPS[dayIndex % DRIVER_TIPS.length];
};

export const getRandomTip = (excluding?: string): string => {
  if (DRIVER_TIPS.length <= 1) return DRIVER_TIPS[0];
  let tip = DRIVER_TIPS[Math.floor(Math.random() * DRIVER_TIPS.length)];
  while (tip === excluding) {
    tip = DRIVER_TIPS[Math.floor(Math.random() * DRIVER_TIPS.length)];
  }
  return tip;
};
