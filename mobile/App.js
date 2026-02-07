// 📱 VIRALIZAAI MOBILE APP - REACT NATIVE
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://viralizaai.com/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeScreen, setActiveScreen] = useState('home');

  useEffect(() => {
    initializeApp();
  }, []);

  // 🚀 INICIALIZAR APP
  const initializeApp = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        await loadUserData(token);
        await loadTools(token);
      } else {
        setActiveScreen('login');
      }
    } catch (error) {
      console.error('Erro ao inicializar:', error);
    } finally {
      setLoading(false);
    }
  };

  // 👤 CARREGAR DADOS DO USUÁRIO
  const loadUserData = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        await AsyncStorage.removeItem('auth_token');
        setActiveScreen('login');
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    }
  };

  // 🛠️ CARREGAR FERRAMENTAS DISPONÍVEIS
  const loadTools = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/tools`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const toolsData = await response.json();
        setTools(toolsData.tools || []);
      }
    } catch (error) {
      console.error('Erro ao carregar ferramentas:', error);
    }
  };

  // 🔐 TELA DE LOGIN
  const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    const handleLogin = async () => {
      if (!email || !password) {
        Alert.alert('Erro', 'Preencha todos os campos');
        return;
      }

      setLoginLoading(true);
      try {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
          await AsyncStorage.setItem('auth_token', data.token);
          await loadUserData(data.token);
          await loadTools(data.token);
          setActiveScreen('home');
        } else {
          Alert.alert('Erro', data.message || 'Credenciais inválidas');
        }
      } catch (error) {
        Alert.alert('Erro', 'Erro de conexão');
      } finally {
        setLoginLoading(false);
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginContainer}>
          <Text style={styles.logo}>🌍🔥 ViralizaAI</Text>
          <Text style={styles.subtitle}>Sua IA no bolso</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loginLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loginLoading}
          >
            <Text style={styles.buttonText}>
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // 🏠 TELA PRINCIPAL
  const HomeScreen = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Olá, {user?.name || 'Usuário'}! 👋
          </Text>
          <View style={[
            styles.planBadge,
            { backgroundColor: user?.plano_ativo ? '#10b981' : '#ef4444' }
          ]}>
            <Text style={styles.planText}>
              {user?.plano || 'Sem plano'} {user?.plano_ativo ? '✅' : '❌'}
            </Text>
          </View>
        </View>

        {/* Ferramentas */}
        <Text style={styles.sectionTitle}>🛠️ Suas Ferramentas</Text>
        <View style={styles.toolsGrid}>
          {tools.map((tool, index) => (
            <TouchableOpacity
              key={index}
              style={styles.toolCard}
              onPress={() => useTool(tool)}
            >
              <Text style={styles.toolIcon}>{tool.icon || '🤖'}</Text>
              <Text style={styles.toolName}>{tool.name}</Text>
              <Text style={styles.toolDescription}>{tool.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Estatísticas */}
        <Text style={styles.sectionTitle}>📊 Suas Estatísticas</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user?.usage_count || 0}</Text>
            <Text style={styles.statLabel}>Usos hoje</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user?.tools_used || 0}</Text>
            <Text style={styles.statLabel}>Ferramentas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user?.days_active || 0}</Text>
            <Text style={styles.statLabel}>Dias ativo</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeScreen === 'home' && styles.navItemActive]}
          onPress={() => setActiveScreen('home')}
        >
          <Text style={styles.navText}>🏠 Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeScreen === 'tools' && styles.navItemActive]}
          onPress={() => setActiveScreen('tools')}
        >
          <Text style={styles.navText}>🛠️ Ferramentas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeScreen === 'support' && styles.navItemActive]}
          onPress={() => setActiveScreen('support')}
        >
          <Text style={styles.navText}>💬 Suporte</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeScreen === 'profile' && styles.navItemActive]}
          onPress={() => setActiveScreen('profile')}
        >
          <Text style={styles.navText}>👤 Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // 🛠️ USAR FERRAMENTA
  const useTool = async (tool) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      // Verificar se usuário tem acesso
      if (!user?.plano_ativo) {
        Alert.alert(
          'Plano Inativo',
          'Você precisa de um plano ativo para usar as ferramentas.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Ver Planos', onPress: () => setActiveScreen('plans') }
          ]
        );
        return;
      }

      // Simular uso da ferramenta
      Alert.alert(
        tool.name,
        `Ferramenta ${tool.name} executada com sucesso! 🚀`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      Alert.alert('Erro', 'Erro ao executar ferramenta');
    }
  };

  // 💬 TELA DE SUPORTE
  const SupportScreen = () => {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [sendingMessage, setSendingMessage] = useState(false);

    const sendSupportMessage = async () => {
      if (!message.trim()) return;

      setSendingMessage(true);
      const userMessage = { role: 'user', content: message, timestamp: new Date() };
      setChatHistory(prev => [...prev, userMessage]);
      setMessage('');

      try {
        const token = await AsyncStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE}/ai/support`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ mensagem: message })
        });

        const data = await response.json();

        if (data.success) {
          const aiMessage = {
            role: 'assistant',
            content: data.resposta,
            timestamp: new Date()
          };
          setChatHistory(prev => [...prev, aiMessage]);
        }
      } catch (error) {
        Alert.alert('Erro', 'Erro ao enviar mensagem');
      } finally {
        setSendingMessage(false);
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.chatContainer}>
          <ScrollView style={styles.chatHistory}>
            {chatHistory.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.chatMessage,
                  msg.role === 'user' ? styles.userMessage : styles.aiMessage
                ]}
              >
                <Text style={styles.chatText}>{msg.content}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.chatInput}>
            <TextInput
              style={styles.messageInput}
              placeholder="Digite sua mensagem..."
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, sendingMessage && styles.buttonDisabled]}
              onPress={sendSupportMessage}
              disabled={sendingMessage}
            >
              <Text style={styles.sendButtonText}>
                {sendingMessage ? '⏳' : '📤'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  };

  // 🎨 RENDERIZAR TELA ATIVA
  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'login':
        return <LoginScreen />;
      case 'support':
        return <SupportScreen />;
      default:
        return <HomeScreen />;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>🚀 Carregando ViralizaAI...</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {renderActiveScreen()}
    </>
  );
}

// 🎨 ESTILOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  planText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  toolCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  toolIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  toolName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  navItemActive: {
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  navText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
  },
  chatHistory: {
    flex: 1,
    padding: 15,
  },
  chatMessage: {
    marginBottom: 15,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#2563eb',
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start',
  },
  chatText: {
    fontSize: 14,
    color: '#000',
  },
  chatInput: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
  },
});
