import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import axios from "axios";
import { useAuth0 } from "react-native-auth0";

export const Step4Categories = ({ onNext, onBack, defaultValues }: any) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>(defaultValues.categories || []);
  const { getCredentials } = useAuth0();

  useEffect(() => {
    (async () => {
      try {
        const credentials = await getCredentials();
        if (!credentials || !credentials.accessToken) {
          Alert.alert("Error", "No se pudo obtener el token de acceso");
          return;
        }
  
        const token = credentials.accessToken;
  
        const { data } = await axios.get("https://delatte-api.com/api/categories/structural", {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        setCategories(data.filter((cat: any) => cat.isActive));
      } catch (err: any) {
        Alert.alert("Error", err.response?.data?.error || err.message);
      }
    })();
  }, []);
  

  const toggleCategory = (id: string) => {
    if (selected.includes(id)) {
      setSelected((prev) => prev.filter((c) => c !== id));
    } else {
      setSelected((prev) => [...prev, id]);
    }
  };

  const validate = () => {
    if (selected.length === 0) {
      Alert.alert("Error", "Seleccioná al menos una categoría");
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (validate()) {
      onNext({ categories: selected });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Categorías</Text>
      <Text style={styles.subtitle}>Seleccioná todas las que correspondan a tu café</Text>

      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat._id}
            style={[
              styles.category,
              selected.includes(cat._id) && styles.categorySelected,
            ]}
            onPress={() => toggleCategory(cat._id)}
          >
            <Text
              style={[
                styles.categoryText,
                selected.includes(cat._id) && styles.categoryTextSelected,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.btnText}>Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSubmit} style={styles.nextBtn}>
          <Text style={styles.btnText}>Finalizar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  category: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  categorySelected: {
    backgroundColor: "#6B4226",
  },
  categoryText: {
    color: "#333",
  },
  categoryTextSelected: {
    color: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
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
