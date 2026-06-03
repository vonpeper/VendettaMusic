import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable } from '../../src/tw';
import { getSessionToken, API_BASE_URL } from '../../src/lib/auth-store';

export default function CalendarScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'past'>('upcoming');
  const router = useRouter();

  const loadEvents = useCallback(async () => {
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
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const today = new Date().setHours(0, 0, 0, 0);
  const filteredEvents = events.filter(e => {
    const eventDate = new Date(e.date).getTime();
    if (activeFilter === 'upcoming') {
      return eventDate >= today;
    } else {
      return eventDate < today;
    }
  });

  // Sort: upcoming in ascending order, past in descending order
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return activeFilter === 'upcoming' ? timeA - timeB : timeB - timeA;
  });

  return (
    <View className="flex-1 bg-zinc-950 px-4 pt-4">
      {/* Tabs Filter */}
      <View className="flex-row bg-zinc-900 p-1 rounded-2xl mb-4 border border-zinc-800/40">
        <Pressable
          onPress={() => setActiveFilter('upcoming')}
          className={`flex-1 py-2.5 rounded-xl justify-center items-center ${
            activeFilter === 'upcoming' ? 'bg-blue-600' : 'bg-transparent'
          }`}
        >
          <Text className={`font-bold text-xs ${activeFilter === 'upcoming' ? 'text-white' : 'text-zinc-400'}`}>
            Próximos Shows
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveFilter('past')}
          className={`flex-1 py-2.5 rounded-xl justify-center items-center ${
            activeFilter === 'past' ? 'bg-blue-600' : 'bg-transparent'
          }`}
        >
          <Text className={`font-bold text-xs ${activeFilter === 'past' ? 'text-white' : 'text-zinc-400'}`}>
            Shows Pasados
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={sortedEvents}
          keyExtractor={(item) => item.eventId}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
          }
          ListEmptyComponent={
            <View className="py-20 items-center justify-center">
              <Ionicons name="calendar-outline" size={48} color="#52525b" />
              <Text className="text-zinc-400 font-bold mt-4 text-center">
                No se encontraron shows para esta categoría.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const dateObj = new Date(item.date);
            return (
              <Pressable
                onPress={() => router.push(`/event/${item.eventId}`)}
                className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4 mb-3 flex-row items-center gap-4 active:bg-zinc-800/50"
              >
                {/* Date display block */}
                <View className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 items-center justify-center w-16">
                  <Text className="text-blue-500 font-black text-lg">
                    {dateObj.getDate()}
                  </Text>
                  <Text className="text-zinc-400 text-[9px] uppercase font-bold mt-0.5">
                    {dateObj.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '')}
                  </Text>
                </View>

                {/* Event info */}
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white font-bold text-sm" numberOfLines={1}>
                      {item.customName}
                    </Text>
                    {item.status === 'pending' && (
                      <View className="w-2 h-2 rounded-full bg-yellow-500" />
                    )}
                  </View>
                  <Text className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                    {item.ceremonyType} • {item.performanceStart} - {item.performanceEnd}
                  </Text>
                  {item.location && (
                    <Text className="text-zinc-500 text-xs" numberOfLines={1}>
                      📍 {item.location.name}
                    </Text>
                  )}
                </View>

                {/* Arrow indicator */}
                <Ionicons name="chevron-forward" size={16} color="#52525b" />
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
