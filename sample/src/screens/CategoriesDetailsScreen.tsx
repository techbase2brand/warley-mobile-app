import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    FlatList,
    Modal,
    Dimensions,
    Pressable,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/dist/AntDesign';
import { whiteColor, blackColor, grayColor, redColor, lightGrayOpacityColor } from '../constants/Color';
import Header from '../components/Header';

const { height: screenHeight } = Dimensions.get('window');

const CategoriesDetailsScreen = ({ route, navigation }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const { title, tabs ,category,selectedCategory} = route.params; // Destructure title and tabs from params
    const [activeTab, setActiveTab] = useState(tabs[0]); // Default to first tab
    const [nestedTabs, setNestedTabs] = useState([]);
    const [activeNestedTab, setActiveNestedTab] = useState(null); // For nested tabs
    const [titleData, setTitledata] = useState([]); // For nested tabs
    // const [tabsdata, showData] = useState([]); // For nested tabs
    console.log("titletitle", selectedCategory,"tabs",category);

    useEffect(() => {
        
        // Check if the active tab has nested tabs
        if (activeTab?.nested) {
            setNestedTabs(activeTab?.nested);
            setActiveNestedTab(activeTab?.nested[0]); // Default to first nested tab
        } else {
            setNestedTabs([]); // No nested tabs
            setActiveNestedTab(null); // Reset nested tab
        }
    }, [activeTab]);
    useEffect(() => {
        if (category?.category =="Alcohol"){
            setModalVisible(true)
        }
    }, []);

    const handleTabPress = (tab) => {
        setActiveTab(tab);
        setActiveNestedTab(null); // Reset nested tab when switching main tabs
    };

    const handleNestedTabPress = (nestedTab) => {
        setActiveNestedTab(nestedTab);
    };

    const renderTab = (tab) => (
        <TouchableOpacity
            key={tab?.title || tab}
            onPress={() => handleTabPress(tab)}
            style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton,
            ]}
        >
            <Text style={activeTab === tab ? styles.activeTabText : styles.tabText}>
                {tab?.title || tab}
            </Text>
        </TouchableOpacity>
    );

    const renderNestedTab = (nestedTab) => (
        <TouchableOpacity
            key={nestedTab}
            onPress={() => handleNestedTabPress(nestedTab)}
            style={[
                styles.nestedTabButton,
                activeNestedTab === nestedTab && styles.activeNestedTabButton,
            ]}
        >
            <Text
                style={
                    activeNestedTab === nestedTab
                        ? styles.activeNestedTabText
                        : styles.nestedTabText
                }
            >
                {nestedTab}
            </Text>
        </TouchableOpacity>
    );

    return (
        <>
            {/* {/ Header /} */}
            <View>
                <Header backIcon={true} text={category?.category} navigation={navigation} />
            </View>
            {/* <Text style={styles.title}>{title}</Text> */}
            <View style={styles.container}>
                {/* Main Tabs */}
                <View>
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                        <View style={styles.tabContainer}>
                            {tabs?.map((tab) => renderTab(tab))}
                        </View>
                    </ScrollView>
                </View>

                {/* Render Nested Tabs if available */}
                {nestedTabs?.length > 0 && (
                    <View style={styles.nestedTabContainer}>
                        {nestedTabs?.map((nestedTab) => renderNestedTab(nestedTab))}
                    </View>
                )}

                {/* Display Content */}
                <View style={styles.contentContainer}>
                    {nestedTabs?.length > 0 ? (
                        <Text style={styles.contentText}>
                            Showing {activeNestedTab || activeTab?.title} content
                        </Text>
                    ) : (
                        <View>
                            {/* Show active tab's data instead of main title */}
                            {!activeTab?.title ? <Text style={styles.contentText}>Items for {activeTab || title}:</Text> :
                                <Text style={styles.contentText}>Items for {activeTab?.title || title}:</Text>}
                            {activeTab?.data && Array.isArray(activeTab.data) && activeTab.data.length > 0 ? (
                                activeTab?.data.map((item, index) => (
                                    // If item has nested data, show it accordingly
                                    <Text key={index} style={styles.itemText}>
                                        {typeof item === 'object' && item.title ? item.title : item}
                                    </Text>))
                            ) : (
                                <Text>No items available.</Text>
                            )}
                        </View>
                    )}
                </View>
                
                <Modal visible={modalVisible} transparent={true} animationType="slide">
              <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: whiteColor }]}>
                  <Text style={styles.modalTitle}>{selectedCategory?.category}</Text>
                 
                  <FlatList
                    data={category?.subCategories || []}
                    keyExtractor={(item, index) => `sub-${index}`}
                    numColumns={2}  // Set number of columns to 2
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setModalVisible(false);
                          setTitledata(item.title)
                          setTabsData(item.data)
                        //   navigation.navigate('CategoriesDetailsScreen', {
                        //     title: item.title,
                        //     tabs: item.data,
                        //   });
                        }}
                        style={styles.subCategoryButton}
                      >
                        <Text style={styles.subCategoryText}>{item.title}</Text>
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.flatListContainer}
                  />

                  <Pressable
                    style={{ position: 'absolute', top: -40, left: '50%' }}
                    onPress={() => setModalVisible(false)}
                  >
                    <AntDesign name={'close'} size={25} color={'black'} />
                  </Pressable>
                </View>
              </View>
            </Modal>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    tabContainer: { flexDirection: 'row', marginBottom: 10 },
    tabButton: {
        paddingVertical: 5,
        // backgroundColor: '#ddd',
        alignItems: 'center',
        marginRight: 20,
        // marginHorizontal:50
        // width: 120,
        // height: 50,
        // borderRadius: 10
    },
    activeTabButton: { borderBottomWidth: 2, borderBottomColor: redColor },
    tabText: { color: '#000' },
    activeTabText: { color: redColor, fontWeight: 'bold' },
    nestedTabContainer: {
        flexDirection: 'row',
        marginVertical: 10,
        justifyContent: 'center',
    },
    nestedTabButton: {
        padding: 8,
        backgroundColor: '#bbb',
        marginHorizontal: 5,
    },
    activeNestedTabButton: { backgroundColor: 'green' },
    nestedTabText: { color: '#000' },
    activeNestedTabText: { color: '#fff', fontWeight: 'bold' },
    contentContainer: { marginTop: 20 },
    contentText: { fontSize: 18, fontWeight: 'bold' },
    itemText: { fontSize: 16, marginVertical: 5 },
    overlay: {
        flex: 1,
        justifyContent: 'flex-end', // Aligns modal at the bottom
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Optional: dimmed background
      },
    modalContainer: {
        height: screenHeight * 0.4, // 40% of screen height
        backgroundColor: 'white', // replace with your desired color
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        // optional: add shadow for iOS
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // optional: add elevation for Android
        elevation: 5,
      },
      modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
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



export default CategoriesDetailsScreen