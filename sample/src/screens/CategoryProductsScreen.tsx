import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const CategoryProductsScreen = ({ route, navigation }) => {
    const { categoryTitle, products ,category} = route.params; // Destructure route params

    const renderProduct = ({ item }) => (
        <View style={styles.productContainer}>
            <Text style={styles.productText}>{item}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Products for {categoryTitle}</Text>
            {products && products.length > 0 ? (
                <FlatList
                    data={products}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderProduct}
                />
            ) : (
                <Text style={styles.noProductsText}>No products available.</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    productContainer: {
        padding: 10,
        borderBottomWidth: 1,
        borderColor: '#ccc',
    },
    productText: { fontSize: 18 },
    noProductsText: { fontSize: 16, color: 'gray', textAlign: 'center', marginTop: 20 },
    flatListContainer: {
        marginTop: 10,
        paddingHorizontal: 10,
      },
      subCategoryButton: {
        flex: 1,
        margin: 5,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        alignItems: 'center',
      },
      subCategoryText: {
        textAlign: 'center',
        fontSize: 16,
      },
});

export default CategoryProductsScreen;
