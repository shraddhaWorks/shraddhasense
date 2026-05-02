"use client";

type Props = {
  onCreated?: () => void;
};

export function AdminCreateEmployeeForm({ onCreated }: Props) {
  return (
    <form
      className="surface-card grid grid-cols-1 gap-3 rounded-2xl p-4 sm:gap-3 sm:p-5 md:grid-cols-2 md:gap-3 lg:grid-cols-3 lg:gap-4 xl:grid-cols-5 xl:gap-3"
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
        className="input-app w-full min-w-0"
      />
      <input
        required
        name="username"
        placeholder="Username"
        className="input-app w-full min-w-0"
      />
      <input
        required
        name="password"
        placeholder="Password"
        type="password"
        className="input-app w-full min-w-0"
      />
      <input
        required
        name="monthlySalary"
        placeholder="Monthly salary"
        type="number"
        min="1"
        className="input-app w-full min-w-0"
      />
      <button
        type="submit"
        className="btn-primary w-full md:col-span-2 lg:col-span-3 xl:col-span-1 xl:w-auto xl:justify-self-start xl:self-end"
      >
        Create Employee
      </button>
    </form>
  );
}
