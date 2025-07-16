import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

export const Step3Images = ({ onNext, onBack, defaultValues }: any) => {
  const [coverImage, setCoverImage] = useState(defaultValues.coverImage || null);
  const [gallery, setGallery] = useState<string[]>(defaultValues.gallery || []);

  const pickImage = async (setImage: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    if (!coverImage) {
      Alert.alert("Error", "Debes subir una imagen de portada");
      return;
    }
    if (gallery.length < 3) {
      Alert.alert("Error", "Subí al menos 3 imágenes a la galería");
      return;
    }
    onNext({ coverImage, gallery });
  };

  const addToGallery = async () => {
    await pickImage((uri) => setGallery((prev) => [...prev, uri]));
  };

  const removeFromGallery = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Imágenes del Café</Text>

      <Text style={styles.label}>Imagen de portada</Text>
      {coverImage ? (
        <TouchableOpacity onPress={() => pickImage(setCoverImage)}>
          <Image source={{ uri: coverImage }} style={styles.cover} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => pickImage(setCoverImage)}
          style={styles.uploadBtn}
        >
          <Text style={styles.uploadText}>Subir portada</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.label, { marginTop: 24 }]}>Galería (mínimo 3 imágenes)</Text>
      <View style={styles.galleryRow}>
        {gallery.map((img, idx) => (
          <TouchableOpacity key={idx} onLongPress={() => removeFromGallery(idx)}>
            <Image source={{ uri: img }} style={styles.galleryImg} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={addToGallery} style={styles.galleryAddBtn}>
          <Text style={styles.galleryAddText}>+</Text>
        </TouchableOpacity>
      </View>

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
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  cover: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 16,
  },
  uploadBtn: {
    padding: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    alignItems: "center",
  },
  uploadText: {
    color: "#6b7280",
  },
  galleryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  galleryImg: {
    width: 80,
    height: 80,
    borderRadius: 6,
  },
  galleryAddBtn: {
    width: 80,
    height: 80,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  galleryAddText: {
    fontSize: 24,
    color: "#6B4226",
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
