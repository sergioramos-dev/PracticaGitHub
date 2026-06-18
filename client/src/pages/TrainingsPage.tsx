import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Training } from "../types";

export function TrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);

  useEffect(() => {
    api<Training[]>("/trainings").then(setTrainings);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Capacitaciones</h2>
        <p className="text-sm text-gray-500">Material de entrenamiento PitTacos</p>
      </div>

      <div className="space-y-3">
        {trainings.map((t) => (
          <Link key={t.id} to={`/capacitaciones/${t.id}`} className="card block hover:border-pittacos-300">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{t.title}</p>
                <p className="text-xs text-pittacos-600">{t.categoryName}</p>
                {t.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{t.description}</p>
                )}
              </div>
              {t.completed ? (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">✓</span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

interface TrainingDetail {
  id: number;
  title: string;
  description: string;
  content: string;
  categoryName: string;
}

export function TrainingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [training, setTraining] = useState<TrainingDetail | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<TrainingDetail>(`/trainings/${id}`).then(setTraining);
  }, [id]);

  const markComplete = async () => {
    if (!training) return;
    await api(`/trainings/${training.id}/complete`, { method: "POST" });
    setDone(true);
  };

  if (!training) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="space-y-4">
      <Link to="/capacitaciones" className="text-sm text-pittacos-600 underline">
        ← Volver
      </Link>
      <div>
        <p className="text-xs text-pittacos-600">{training.categoryName}</p>
        <h2 className="text-xl font-bold">{training.title}</h2>
        {training.description && (
          <p className="mt-1 text-gray-500">{training.description}</p>
        )}
      </div>
      <div className="card whitespace-pre-wrap text-sm leading-relaxed">{training.content}</div>
      {!done ? (
        <button onClick={markComplete} className="btn-primary w-full">
          Marcar como completada
        </button>
      ) : (
        <p className="text-center text-green-600">✓ Capacitación completada</p>
      )}
    </div>
  );
}
