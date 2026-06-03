import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Linking, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ScrollView, Pressable } from '../../src/tw';
import { getSessionToken, API_BASE_URL } from '../../src/lib/auth-store';

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadEventDetails = useCallback(async () => {
    try {
      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/mobile/events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const found = data.events.find((e: any) => e.eventId === id);
        setEvent(found || null);
      }
    } catch (error) {
      console.error('Error loading event details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEventDetails();
  }, [loadEventDetails]);

  async function handleResponse(status: 'confirmed' | 'rejected') {
    if (status === 'rejected') {
      Alert.alert(
        'Rechazar Convocatoria',
        '¿Estás seguro de que no puedes asistir a este show?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Rechazar',
            style: 'destructive',
            onPress: () => submitResponse(status),
          },
        ]
      );
    } else {
      submitResponse(status);
    }
  }

  async function submitResponse(status: 'confirmed' | 'rejected') {
    setUpdating(true);
    try {
      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/mobile/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: id,
          status,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert('Éxito', status === 'confirmed' ? 'Has confirmado tu asistencia.' : 'Has rechazado la convocatoria.');
        loadEventDetails();
      } else {
        throw new Error(data.error || 'No se pudo actualizar la asistencia.');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Error al conectar con el servidor.');
    } finally {
      setUpdating(false);
    }
  }

  function openMaps() {
    if (event?.location?.mapsLink) {
      Linking.openURL(event.location.mapsLink).catch(() => {
        Alert.alert('Error', 'No se pudo abrir el mapa.');
      });
    } else {
      Alert.alert('Error', 'No hay enlace de mapas disponible.');
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-zinc-950 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 bg-zinc-950 justify-center items-center px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-white font-bold text-lg mt-4">Show no encontrado</Text>
        <Text className="text-zinc-500 text-xs text-center mt-2">
          El evento al que intentas acceder no está registrado o no estás convocado.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-zinc-950">
      <View className="p-6 gap-6">
        {/* Title & Logistics Block */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-blue-500 text-xs font-bold uppercase tracking-wider">
              {event.ceremonyType}
            </Text>
            
            {/* Status Indicator */}
            <View className={`px-3 py-1 rounded-full ${
              event.status === 'confirmed' ? 'bg-green-500/10 border border-green-500/20' :
              event.status === 'rejected' ? 'bg-red-500/10 border border-red-500/20' :
              'bg-yellow-500/10 border border-yellow-500/20'
            }`}>
              <Text className={`text-[10px] font-black uppercase tracking-wider ${
                event.status === 'confirmed' ? 'text-green-500' :
                event.status === 'rejected' ? 'text-red-500' :
                'text-yellow-500'
              }`}>
                {event.status === 'confirmed' ? 'Confirmado' :
                 event.status === 'rejected' ? 'Rechazado' :
                 'Pendiente'}
              </Text>
            </View>
          </View>
          
          <Text className="text-white text-2xl font-black">{event.customName}</Text>
          <Text className="text-zinc-400 text-xs mt-2 font-bold uppercase tracking-wider">
            {event.packageName}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => handleResponse('confirmed')}
            disabled={updating}
            className={`flex-1 h-12 rounded-xl justify-center items-center flex-row gap-2 border ${
              event.status === 'confirmed'
                ? 'bg-green-600/10 border-green-500/30'
                : 'bg-green-600 active:bg-green-700 border-transparent'
            }`}
          >
            <Ionicons name="checkmark-circle" size={18} color={event.status === 'confirmed' ? '#22c55e' : '#ffffff'} />
            <Text className={`font-bold text-sm ${event.status === 'confirmed' ? 'text-green-500' : 'text-white'}`}>
              {event.status === 'confirmed' ? 'Confirmado ✓' : 'Confirmar'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleResponse('rejected')}
            disabled={updating}
            className={`flex-1 h-12 rounded-xl justify-center items-center flex-row gap-2 border ${
              event.status === 'rejected'
                ? 'bg-red-600/10 border-red-500/30'
                : 'bg-zinc-900 active:bg-zinc-800 border-zinc-800'
            }`}
          >
            <Ionicons name="close-circle" size={18} color={event.status === 'rejected' ? '#ef4444' : '#71717a'} />
            <Text className={`font-bold text-sm ${event.status === 'rejected' ? 'text-red-500' : 'text-zinc-300'}`}>
              {event.status === 'rejected' ? 'Rechazado' : 'Rechazar'}
            </Text>
          </Pressable>
        </View>

        {/* Timings Logistics Card */}
        <View className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-5 gap-4">
          <Text className="text-white font-black text-xs uppercase tracking-widest border-b border-zinc-800/40 pb-2">
            Horarios & Logística
          </Text>

          <View className="flex-row items-center gap-3">
            <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
            <View>
              <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Fecha del Show</Text>
              <Text className="text-zinc-100 text-sm font-bold mt-0.5">
                {new Date(event.date).toLocaleDateString('es-MX', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <Ionicons name="construct-outline" size={20} color="#3b82f6" />
            <View>
              <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Montaje de Equipo</Text>
              <Text className="text-zinc-100 text-sm mt-0.5">{event.setupTime}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <Ionicons name="people-outline" size={20} color="#3b82f6" />
            <View>
              <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Llegada Músicos</Text>
              <Text className="text-zinc-100 text-sm mt-0.5">{event.arrivalTime}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <Ionicons name="musical-notes-outline" size={20} color="#3b82f6" />
            <View>
              <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Duración de Show</Text>
              <Text className="text-zinc-100 text-sm mt-0.5">{event.performanceStart} a {event.performanceEnd}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <Ionicons name="shirt-outline" size={20} color="#3b82f6" />
            <View>
              <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Código de Vestimenta</Text>
              <Text className="text-zinc-100 text-sm mt-0.5 capitalize">{event.dressCode}</Text>
            </View>
          </View>
        </View>

        {/* Client Name Details Card */}
        {event.clientName && (
          <View className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-5 gap-3">
            <Text className="text-white font-black text-xs uppercase tracking-widest border-b border-zinc-800/40 pb-2">
              Información del Cliente
            </Text>
            <View className="flex-row items-center gap-3 mt-1">
              <Ionicons name="person-outline" size={20} color="#3b82f6" />
              <View>
                <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Nombre del Cliente</Text>
                <Text className="text-zinc-100 text-sm font-bold mt-0.5">{event.clientName}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Location Details Card */}
        {event.location && (
          <View className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-5 gap-3">
            <Text className="text-white font-black text-xs uppercase tracking-widest border-b border-zinc-800/40 pb-2">
              Dirección & Ubicación
            </Text>

            <Text className="text-white font-bold text-sm mt-1">{event.location.name}</Text>
            <Text className="text-zinc-400 text-xs leading-5">{event.location.address}</Text>
            <Text className="text-zinc-400 text-xs">{event.location.city}, {event.location.state}</Text>

            {event.location.mapsLink ? (
              <Pressable
                onPress={openMaps}
                className="h-10 bg-zinc-950 border border-zinc-800 rounded-xl justify-center items-center flex-row gap-2 mt-2 active:bg-zinc-800"
              >
                <Ionicons name="map-outline" size={16} color="#3b82f6" />
                <Text className="text-blue-500 font-bold text-xs">Abrir en Google Maps</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {/* Musician Notes Card */}
        <View className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-5 gap-3 mb-6">
          <Text className="text-white font-black text-xs uppercase tracking-widest border-b border-zinc-800/40 pb-2">
            Notas Especiales
          </Text>
          <Text className="text-zinc-300 text-xs leading-5">
            {event.musicianNotes}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
