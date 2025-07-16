import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity } from "react-native";

const days = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export const Step2Schedule = ({ onNext, onBack, defaultValues }: any) => {
  const [schedule, setSchedule] = useState(() => {
    const initial: Record<string, { open: string; close: string }> = {};
    days.forEach((day) => {
      initial[day] = defaultValues.schedule?.[day] || { open: "", close: "" };
    });
    return initial;
    
  });

  const handleChange = (day: string, field: "open" | "close", value: string) => {
    setSchedule((prev: any) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const validate = () => {
    const hasAtLeastOneDay = Object.values(schedule).some((day: any) => day.open && day.close);
    if (!hasAtLeastOneDay) {
      Alert.alert("Error", "Cargá al menos un horario de atención");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validate()) onNext({ schedule });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Horarios de atención</Text>

      {days.map((day) => (
        <View key={day} style={styles.dayRow}>
          <Text style={styles.dayLabel}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Desde (HH:mm)"
              keyboardType="numeric"
              value={schedule[day].open}
              onChangeText={(value) => handleChange(day, "open", value)}
              maxLength={5}
            />
            <TextInput
              style={styles.input}
              placeholder="Hasta (HH:mm)"
              keyboardType="numeric"
              value={schedule[day].close}
              onChangeText={(value) => handleChange(day, "close", value)}
              maxLength={5}
            />
          </View>
        </View>
      ))}

      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.btnText}>Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
          <Text style={styles.btnText}>Siguiente</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  dayRow: {
    marginBottom: 16,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  inputGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  backBtn: {
    backgroundColor: "#aaa",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  nextBtn: {
    backgroundColor: "#6B4226",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  btnText: {
    textAlign: "center",
    color: "white",
    fontWeight: "600",
  },
});