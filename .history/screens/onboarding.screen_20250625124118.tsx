import {
  Alert,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useState, useCallback, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { scale, verticalScale } from "react-native-size-matters";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Audio, AVPlaybackStatus, AVPlaybackSource, Recording } from "expo-av";
import LottieView from "lottie-react-native";
import * as Speech from "expo-speech";
import { useFocusEffect } from "@react-navigation/native";
import { MotiView } from "moti";

type Message = {
  role: string;
  content: string;
  timestamp: number;
};

type ModeKey = 'friendly' | 'sassy' | 'motivational' | 'humorous';

export default function HomeScreen() {
  const [text, setText] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [selectedPersonality, setSelectedPersonality] = useState<ModeKey>("friendly");
  const [modeIntro, setModeIntro] = useState<string>("");
  const [typingIndex, setTypingIndex] = useState<number>(0);

  const modeQuotes: Record<ModeKey, string> = {
    friendly: "Hey there! Let’s make this a great chat!",
    sassy: "Oh honey, buckle up. You picked the best version of me.",
    motivational: "Let’s get to work. You’ve got greatness to unlock.",
    humorous: "Why did the AI cross the road? To answer your questions, duh!",
  };

  useEffect(() => {
    if (modeIntro === "") return;
    setTypingIndex(0);

    const interval = setInterval(() => {
      setTypingIndex((prev) => {
        if (prev >= modeIntro.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [modeIntro]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        Speech.stop();
        setIsLoading(false);
        setIsSpeaking(false);
        if (recording) {
          recording.stopAndUnloadAsync().catch((e: any) => console.log("Error stopping recording:", e));
          setRecording(null);
          setIsRecording(false);
        }
      };
    }, [recording])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      setConversationHistory((prev) => prev.filter((entry) => entry.timestamp > thirtyMinutesAgo));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getMicrophonePermission = async (): Promise<boolean> => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission", "Please grant permission to access microphone");
        return false;
      }
      return true;
    } catch (error) {
      console.log("Microphone Permission Error:", error);
      return false;
    }
  };

  const recordingOptions: Audio.RecordingOptions = {
    android: {
      extension: ".m4a",
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
    },
    ios: {
      extension: ".m4a",
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {} as Audio.RecordingOptions,
  };

  const startRecording = async () => {
    const hasPermission = await getMicrophonePermission();
    if (!hasPermission) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setIsRecording(true);
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
    } catch (error) {
      console.log("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      if (!uri) return;

      setIsLoading(true);
      const transcript = await sendAudioToWhisper(uri);
      if (transcript) {
        setText(transcript);

        const aiResponse = await getSmartAIResponse(transcript);
        setResponse(aiResponse);

        setConversationHistory((prev) => [
          ...prev,
          { role: "user", content: transcript, timestamp: Date.now() },
          { role: "assistant", content: aiResponse, timestamp: Date.now() },
        ]);

        setIsLoading(false);
        setIsSpeaking(true);
        Speech.speak(aiResponse, {
          onDone: () => {
            setIsSpeaking(false);
            Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
              playsInSilentModeIOS: true,
            }).catch((error) => console.log("Audio reset error after speaking:", error));
          },
        });
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.log("Failed to stop recording:", error);
      Alert.alert("Error", "Failed to stop recording");
      setIsLoading(false);
    }
  };

  const sendAudioToWhisper = async (uri: string): Promise<string | undefined> => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        type: "audio/m4a",
        name: "recording.m4a",
      } as any);

      const response = await fetch("https://hello-allie-backend.onrender.com/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.log("Whisper Transcription Error:", error);
      Alert.alert("Error", "Failed to transcribe audio");
    }
  };

  const getSmartAIResponse = async (prompt: string): Promise<string> => {
    try {
      const res = await fetch("https://hello-allie-backend.onrender.com/api/smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, conversationHistory, mode: selectedPersonality }),
      });
      const data = await res.json();
      return data.result || "Sorry, something went wrong.";
    } catch (error) {
      console.error("Smart AI Fetch Error:", error);
      return "Sorry, something went wrong.";
    }
  };

  const cancelSpeaking = async () => {
    Speech.stop();
    setIsSpeaking(false);
    setIsLoading(false);

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.log("Audio mode reset error on cancel:", error);
    }
  };

  // ... UI rendering code stays unchanged
}
