import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Edit2, Gift, Trophy } from 'lucide-react';
import type { Reward, CreateRewardInput } from '../types';

export default function RewardsNew() {
  const { user } = useStore();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const isAdmin = user?.role === 'chef';

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const data = await api.rewards.getAll();
      setRewards(data);
    } catch (error) {
      console.error('Error cargando premios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este premio?')) return;

    try {
      await api.rewards.delete(id);
      loadRewards();
    } catch (error) {
      console.error('Error eliminando premio:', error);
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setShowModal(true);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-orange-500" />
            Premios y Recompensas
          </h1>
          <p className="text-gray-600 mt-2">
            {isAdmin
              ? 'Motiva a tu equipo agregando premios y recompensas por cumplir objetivos'
              : 'Cumple tus objetivos y gana increíbles premios'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingReward(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Premio
          </button>
        )}
      </div>

      {/* Rewards Grid */}
      {rewards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-lg hover:scale-105 transition-transform"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="text-5xl">{reward.icon}</div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(reward)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => handleDelete(reward.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {reward.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {reward.description}
              </p>
              {isAdmin && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Creado por: {reward.created_by}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center shadow-lg">
          <Gift className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {isAdmin ? 'No hay premios configurados' : 'Aún no hay premios disponibles'}
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {isAdmin
              ? 'Comienza a motivar a tu equipo agregando premios y recompensas'
              : 'Pronto habrá premios increíbles esperándote'}
          </p>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingReward(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Crear Primer Premio
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <RewardModal
          reward={editingReward}
          onClose={() => {
            setShowModal(false);
            setEditingReward(null);
          }}
          onSuccess={() => {
            loadRewards();
            setShowModal(false);
            setEditingReward(null);
          }}
          userName={user?.name || ''}
        />
      )}
    </div>
  );
}

interface RewardModalProps {
  reward: Reward | null;
  onClose: () => void;
  onSuccess: () => void;
  userName: string;
}

function RewardModal({ reward, onClose, onSuccess, userName }: RewardModalProps) {
  const [formData, setFormData] = useState({
    title: reward?.title || '',
    description: reward?.description || '',
    icon: reward?.icon || '🎁',
  });

  const emojiOptions = ['🎁', '🏆', '🎉', '🍕', '🎬', '🎮', '💰', '🎟️', '🛍️', '🎈'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (reward) {
        await api.rewards.update(reward.id, formData);
      } else {
        await api.rewards.create({ ...formData, created_by: userName });
      }
      onSuccess();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {reward ? 'Editar Premio' : 'Nuevo Premio'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icono
            </label>
            <div className="grid grid-cols-5 gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: emoji })}
                  className={`text-3xl p-3 rounded-lg border-2 transition-all ${
                    formData.icon === emoji
                      ? 'border-orange-500 bg-orange-50 scale-110'
                      : 'border-gray-300 hover:border-orange-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título del Premio
            </label>
            <input
              type="text"
              required
              placeholder="Ej: 2 Pizzas Familiares"
              className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors font-medium"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe el premio y cómo ganarlo"
              className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors font-medium resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
            >
              {reward ? 'Actualizar' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
