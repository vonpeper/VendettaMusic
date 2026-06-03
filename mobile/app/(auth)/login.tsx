import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView } from '../../src/tw';
import { saveSession, API_BASE_URL } from '../../src/lib/auth-store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Algo salió mal al iniciar sesión.');
      }

      await saveSession(data.token, data.user);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error de Inicio de Sesión', error?.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-black"
    >
      <View className="flex-1 justify-center px-6 bg-zinc-950">
        <View className="items-center mb-8">
          <Text className="text-4xl font-extrabold text-blue-500 tracking-wider">VENDETTA</Text>
          <Text className="text-sm text-zinc-400 mt-2 uppercase tracking-widest">Portal de Músicos</Text>
        </View>

        <View className="space-y-4 gap-4">
          <View>
            <Text className="text-xs font-bold text-zinc-400 uppercase mb-2 tracking-wider">Correo Electrónico</Text>
            <TextInput
              className="h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-zinc-100 placeholder-zinc-600 focus:border-blue-500"
              placeholder="tu@correo.com"
              placeholderTextColor="#52525b"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View>
            <Text className="text-xs font-bold text-zinc-400 uppercase mb-2 tracking-wider">Contraseña</Text>
            <TextInput
              className="h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-zinc-100 placeholder-zinc-600 focus:border-blue-500"
              placeholder="••••••••"
              placeholderTextColor="#52525b"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className="h-12 bg-blue-600 active:bg-blue-700 rounded-xl justify-center items-center mt-4 transition-colors"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-bold text-base">Iniciar Sesión</Text>
            )}
          </Pressable>
        </View>

        <Text className="text-xs text-center text-zinc-500 mt-12">
          Ingresa utilizando tus credenciales de administración de la plataforma web.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
