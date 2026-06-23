"use client";

export default function EmailForm() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = (
      e.currentTarget.elements.namedItem("email") as HTMLInputElement
    ).value;
    alert(`Thanks! We'll be in touch at ${email}`);
    e.currentTarget.reset();
  }

  return (
    <form
      className="flex flex-col sm:flex-row gap-4 justify-center"
      onSubmit={handleSubmit}
    >
      <label htmlFor="early-access-email" className="sr-only">
        Email address
      </label>
      <input
        id="early-access-email"
        name="email"
        type="email"
        placeholder="Enter your email"
        required
        aria-label="Email address"
        className="flex-1 max-w-sm px-5 py-4 rounded-xl text-base outline-none border"
        style={{
          background: "var(--navy-light)",
          color: "var(--foreground)",
          borderColor: "var(--navy-light)",
        }}
      />
      <button
        type="submit"
        className="px-8 py-4 rounded-xl text-base font-bold transition-all hover:scale-105 shadow-lg"
        style={{ background: "var(--gold)", color: "var(--navy)" }}
      >
        Get Early Access
      </button>
    </form>
  );
}
