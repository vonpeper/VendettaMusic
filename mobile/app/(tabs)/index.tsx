import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ScrollView, Pressable } from '../../src/tw';
import { getSessionUser, clearSession, API_BASE_URL, getSessionToken, MobileUser } from '../../src/lib/auth-store';

export default function DashboardScreen() {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      const sessionUser = await getSessionUser();
      setUser(sessionUser);

      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/mobile/events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  async function handleLogout() {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await clearSession();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  // Get next upcoming show
  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)));
  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;
  const pendingCount = upcomingEvents.filter(e => e.status === 'pending').length;

  return (
    <ScrollView
      className="flex-1 bg-zinc-950"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
      }
    >
      <View className="p-6">
        {/* Header User Details & Logout */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-zinc-500 text-xs uppercase tracking-widest">Hola,</Text>
            <Text className="text-white text-2xl font-black mt-1">{user?.name || 'Músico'}</Text>
            <Text className="text-blue-500 text-xs mt-0.5 font-bold uppercase tracking-wider">
              {user?.role === 'ADMIN' ? 'Administrador' : 'Staff / Músico'}
            </Text>
          </View>
          <Pressable
            onPress={handleLogout}
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl active:bg-zinc-800"
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          </Pressable>
        </View>

        {loading ? (
          <View className="py-20 justify-center items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <View className="gap-6">
            {/* Quick stats banner */}
            {pendingCount > 0 && (
              <View className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl flex-row items-center gap-3">
                <Ionicons name="alert-circle-outline" size={24} color="#3b82f6" />
                <View className="flex-1">
                  <Text className="text-blue-500 font-bold text-sm">Invitaciones Pendientes</Text>
                  <Text className="text-zinc-300 text-xs mt-0.5">Tienes {pendingCount} convocatorias sin responder.</Text>
                </View>
                <Pressable
                  onPress={() => router.push('/calendar')}
                  className="bg-blue-600 px-3 py-1.5 rounded-xl"
                >
                  <Text className="text-white text-xs font-bold">Ver</Text>
                </Pressable>
              </View>
            )}

            {/* Next Show Container */}
            <View>
              <Text className="text-zinc-400 font-black text-xs uppercase tracking-widest mb-3">Próximo Show</Text>
              
              {nextEvent ? (
                <Pressable
                  onPress={() => router.push(`/event/${nextEvent.eventId}`)}
                  className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 active:bg-zinc-900/80"
                >
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="bg-blue-600/10 px-3 py-1.5 rounded-xl border border-blue-500/10">
                      <Text className="text-blue-500 text-[10px] font-bold uppercase tracking-wider">
                        {nextEvent.ceremonyType}
                      </Text>
                    </View>
                    
                    {/* Status Badge */}
                    <View className={`px-3 py-1 rounded-full ${
                      nextEvent.status === 'confirmed' ? 'bg-green-500/10 border border-green-500/20' :
                      nextEvent.status === 'rejected' ? 'bg-red-500/10 border border-red-500/20' :
                      'bg-yellow-500/10 border border-yellow-500/20'
                    }`}>
                      <Text className={`text-[10px] font-black uppercase tracking-wider ${
                        nextEvent.status === 'confirmed' ? 'text-green-500' :
                        nextEvent.status === 'rejected' ? 'text-red-500' :
                        'text-yellow-500'
                      }`}>
                        {nextEvent.status === 'confirmed' ? 'Confirmado' :
                         nextEvent.status === 'rejected' ? 'Rechazado' :
                         'Pendiente'}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-white text-lg font-black">{nextEvent.customName}</Text>
                  
                  {/* Event Details */}
                  <View className="mt-4 space-y-2 gap-2 border-t border-zinc-800/40 pt-4">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="calendar" size={16} color="#71717a" />
                      <Text className="text-zinc-300 text-xs">
                        {new Date(nextEvent.date).toLocaleDateString('es-MX', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <Ionicons name="time" size={16} color="#71717a" />
                      <Text className="text-zinc-300 text-xs">
                        Show: {nextEvent.performanceStart} - {nextEvent.performanceEnd}
                      </Text>
                    </View>

                    {nextEvent.location && (
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="location" size={16} color="#71717a" />
                        <Text className="text-zinc-300 text-xs" numberOfLines={1}>
                          {nextEvent.location.name} — {nextEvent.location.city}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="bg-zinc-950 rounded-xl p-3 mt-4 flex-row justify-between items-center">
                    <Text className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Ver más detalles</Text>
                    <Ionicons name="chevron-forward" size={14} color="#71717a" />
                  </View>
                </Pressable>
              ) : (
                <View className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl items-center">
                  <Ionicons name="musical-notes-outline" size={32} color="#52525b" />
                  <Text className="text-zinc-400 font-bold mt-3 text-center">No tienes próximos shows agendados.</Text>
                </View>
              )}
            </View>

            {/* Quick reminders card */}
            <View className="bg-zinc-900/50 border border-zinc-800/60 p-5 rounded-2xl gap-3">
              <Text className="text-white font-bold text-sm">💡 Recordatorio Logístico</Text>
              <Text className="text-zinc-400 text-xs leading-5">
                Por favor confirma tu asistencia a los shows lo antes posible para asegurar el staff titular del evento. Recuerda que no debes compartir información de clientes ni tarifas fuera del sistema.
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
