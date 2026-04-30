"use client";

type Props = {
  onCreated?: () => void;
};

export function AdminCreateEmployeeForm({ onCreated }: Props) {
  return (
    <form
      className="grid gap-2 rounded-lg border border-orange-200 bg-white p-4 md:grid-cols-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const payload = {
          name: formData.get("name"),
          username: formData.get("username"),
          password: formData.get("password"),
          monthlySalary: Number(formData.get("monthlySalary")),
        };
        const res = await fetch("/api/admin/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          form.reset();
          onCreated?.();
        }
      }}
    >
      <input
        required
        name="name"
        placeholder="Employee name"
        className="rounded border border-orange-200 px-2 py-2 text-sm"
      />
      <input
        required
        name="username"
        placeholder="Username"
        className="rounded border border-orange-200 px-2 py-2 text-sm"
      />
      <input
        required
        name="password"
        placeholder="Password"
        type="password"
        className="rounded border border-orange-200 px-2 py-2 text-sm"
      />
      <input
        required
        name="monthlySalary"
        placeholder="Monthly salary"
        type="number"
        min="1"
        className="rounded border border-orange-200 px-2 py-2 text-sm"
      />
      <button className="rounded bg-orange-500 px-3 py-2 text-sm text-white hover:bg-orange-600">
        Create Employee
      </button>
    </form>
  );
}
