import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Category {
  id: number;
  name: string;
}

export function AdminTrainingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api<Category[]>("/trainings/categories").then(setCategories);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/trainings", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          content,
          categoryId: categoryId || undefined,
        }),
      });
      setMessage("✓ Capacitación creada");
      setTitle("");
      setDescription("");
      setContent("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Nueva capacitación</h2>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Título</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="label">Categoría</label>
          <select
            className="input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Descripción corta</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label">Contenido</label>
          <textarea
            className="input min-h-[160px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        {message && (
          <p className={`text-sm ${message.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
        <button type="submit" className="btn-primary w-full">
          Crear capacitación
        </button>
      </form>
    </div>
  );
}
