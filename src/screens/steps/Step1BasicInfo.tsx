import React, { useState } from "react";
import { View, TextInput, Text, Button, StyleSheet } from "react-native";

export const Step1BasicInfo = ({ onNext, defaultValues }: any) => {
  const [form, setForm] = useState({
    name: defaultValues.name || "",
    address: defaultValues.address || "",
    phone: defaultValues.phone || "",
    email: defaultValues.email || "",
    instagram: defaultValues.instagram || "",
    menuUrl: defaultValues.menuUrl || "",
    description: defaultValues.description || "",
  });

  const handleNext = () => {
    if (!form.name || !form.address || !form.phone || !form.email || !form.description) {
      alert("Por favor completá todos los campos obligatorios.");
      return;
    }
    onNext(form);
  };

  return (
    <View>
      <Text style={styles.label}>Nombre *</Text>
      <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />

      <Text style={styles.label}>Dirección *</Text>
      <TextInput style={styles.input} value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} />

      <Text style={styles.label}>Teléfono *</Text>
      <TextInput style={styles.input} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />

      <Text style={styles.label}>Email *</Text>
      <TextInput style={styles.input} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" />

      <Text style={styles.label}>Instagram</Text>
      <TextInput style={styles.input} value={form.instagram} onChangeText={(v) => setForm({ ...form, instagram: v })} />

      <Text style={styles.label}>Menú (URL)</Text>
      <TextInput style={styles.input} value={form.menuUrl} onChangeText={(v) => setForm({ ...form, menuUrl: v })} />

      <Text style={styles.label}>Descripción *</Text>
      <TextInput style={[styles.input, { height: 80 }]} multiline value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} />

      <Button title="Siguiente" onPress={handleNext} />
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginTop: 10,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
});
