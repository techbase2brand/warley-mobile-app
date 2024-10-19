import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text, Image, FlatList, Pressable, ActivityIndicator, ImageBackground, Alert } from 'react-native';
import useShopify from '../hooks/useShopify';
import { Colors, useTheme } from '../context/Theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { blackColor, redColor, whiteColor, grayColor, lightGrayOpacityColor, mediumGray } from '../constants/Color'
import { spacings, style } from '../constants/Fonts';
import { BaseStyle } from '../constants/Style';
import Header from '../components/Header'
import { widthPercentageToDP as wp, heightPercentageToDP as hp, } from '../utils';
import { logEvent } from '@amplitude/analytics-react-native';
import { getAdminAccessToken, getStoreDomain, STOREFRONT_DOMAIN, ADMINAPI_ACCESS_TOKEN, STOREFRONT_ACCESS_TOKEN, LOADER_NAME } from '../constants/Constants'
import { ShopifyProduct } from '../../@types';
import { BACKGROUND_IMAGE, DARK_BACKGROUND_IMAGE } from '../assests/images'
import Product from '../components/ProductVertical';
import { useCart } from '../context/Cart';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import LoaderKit from 'react-native-loader-kit';
import { useThemes } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/Color';
import ChatButton from '../components/ChatButton';
import { scheduleNotification } from '../notifications';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
const { flex, textAlign, alignItemsCenter, resizeModeContain, borderRadius10, positionRelative, alignJustifyCenter, resizeModeCover } = BaseStyle;
type Props = NativeStackScreenProps<RootStackParamList, 'CatalogScreen'>;

function CatalogScreen({ navigation }: Props) {
  const selectedItem = useSelector((state) => state.menu.selectedItem);
  // const STOREFRONT_DOMAIN = getStoreDomain(selectedItem)
  // const ADMINAPI_ACCESS_TOKEN = getAdminAccessToken(selectedItem)
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { queries } = useShopify();
  const { addToCart, addingToCart } = useCart();
  const [fetchCollections, { data: collectionData }] = queries?.collections;
  const [products, setProducts] = useState([]);
  const [inventoryQuantities, setInventoryQuantities] = useState('');
  const [tags, setTags] = useState<string[][]>([]);
  const [options, setOptions] = useState([]);
  const [productVariantsIDS, setProductVariantsIDS] = useState([]);
  const [loading, setLoading] = useState(false)
  const [collectionTitle, setCollectionTitle] = useState('')
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [collectionsFetched, setCollectionsFetched] = useState(false);
  const [shopifyCollection, setShopifyCollection] = useState([])
  const { isDarkMode } = useThemes();
  const themecolors = isDarkMode ? darkColors : lightColors;
  useEffect(() => {
    logEvent('Catalog Screen Initialized');
  }, [])

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchCollections({
        variables: {
          first: 150,
        },
      });
      setCollectionsFetched(true);
    };
    fetchInitialData()
    const CollectionId = ("gid://shopify/Collection/632394318170");
    const CollectionName = ("Home");
    onPressCollection(CollectionId, CollectionName)
    setSelectedCollectionId(CollectionId)

  }, [fetchCollections, selectedItem]);


  useFocusEffect(
    useCallback(() => {
      if (collectionsFetched) {
        fetchProdcutCollection();
      }
    }, [collectionsFetched, selectedItem])
  );

  const fetchProdcutCollection = async () => {
    try {
      const response = await axios.post(
        `https://${STOREFRONT_DOMAIN}/api/2023-04/graphql.json`,
        {
          query: `
          {
            menu(handle: "main-menu") {
              items {
                title
                url
                type
                items {
                  title
                  id
                }
              }
            }
          }
        `,
        },
        {
          headers: {
            'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
            'Content-Type': 'application/json',
          },
        }
      );
      const filteredItems = response.data.data.menu.items.filter(item =>
        item.title.toLowerCase() === selectedItem.toLowerCase()
      );
      filteredItems.forEach((item) => {

        let matchedCollectionsArray = [];
        item?.items?.forEach(selectedItem => {

          if (collectionData && collectionData.collections && collectionData.collections.edges) {
            let matchedCollection = collectionData.collections.edges.find(collection => {
              return collection?.node?.title === selectedItem?.title;
            });
            if (matchedCollection) {
              matchedCollectionsArray.push(matchedCollection.node);
            }
          }
        });

        setShopifyCollection(matchedCollectionsArray);
      });
    } catch (error) {
      console.log('Error fetching main menu:', error);
    }
  };

  //onPressCollection
  const onPressCollection = (id: any, title: string) => {
    logEvent(`${title} Collection Pressed from Catalog Screen`)
    setCollectionTitle(title)
    setSelectedCollectionId(id)
    setLoading(true)
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("X-Shopify-Access-Token", ADMINAPI_ACCESS_TOKEN);
    const graphql = JSON.stringify({
      query: `query MyQuery {
        collection(id: "${id}") {
          products(first: 10) {
            nodes {
              id
              images(first: 10) {
                nodes {
                  src
                  url
                }
              }
              title
              description
              vendor
              tags
              options(first:10){
                id
                name
                values
              }
              variants(first: 10) {
                nodes {
                  price
                  inventoryQuantity
                  id
                  title
                  image {
                    originalSrc
                  }
                }
              }
            }
          }
        }
      }`,
      variables: {}
    });
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: graphql,
      redirect: "follow"
    };
    fetch(`https://${STOREFRONT_DOMAIN}/admin/api/2024-04/graphql.json`, requestOptions)
      .then((response) => response.text())
      .then((result) => {
        const fetchedProducts = JSON.parse(result);
        setProducts(fetchedProducts?.data?.collection?.products.nodes);
        setLoading(false)
        const inventoryQuantities = fetchedProducts?.data?.collection?.products?.nodes?.map((productEdge) => {
          return productEdge?.variants?.nodes?.map((variants) => variants?.inventoryQuantity);
        });
        setInventoryQuantities(inventoryQuantities)
        const fetchedTags = fetchedProducts?.data?.collection?.products?.nodes.map(productEdge => productEdge.tags);
        setTags(fetchedTags);

        const fetchedOptions = fetchedProducts?.data?.collection?.products?.nodes.map(product => product.options);
        setOptions(fetchedOptions);

        const productVariantData = fetchedProducts?.data?.collection?.products?.nodes.map(productEdge => {
          return productEdge?.variants?.nodes.map(variant => ({
            id: variant?.id,
            title: variant?.title,
            inventoryQty: variant?.inventoryQuantity,
            image: variant?.image
          }));
        });
        setProductVariantsIDS(productVariantData)
      })
      .catch((error) => {
        setLoading(false)
        console.log("error", error)
      }
      );

  }

  function getVariant(node: ShopifyProduct) {
    return node?.variants?.nodes;
  }

  //Add to cart Product
  const addToCartProduct = async (variantId: any, quantity: any) => {
    logEvent(`Add To Cart Pressed variantId:${variantId} Qty:${quantity}`);
    await addToCart(variantId, quantity);
    Toast.show(`${quantity} item${quantity !== 1 ? 's' : ''} added to cart`);
    scheduleNotification()
  };

  const handleChatButtonPress = () => {
    logEvent('Chat button clicked in Catalog Screen');
    navigation.navigate("ShopifyInboxScreen")
  };

  return (
    <ImageBackground style={[flex, { backgroundColor: themecolors.whiteColor }]} source={isDarkMode ? DARK_BACKGROUND_IMAGE : BACKGROUND_IMAGE}>
      <Header
        navigation={navigation}
        backIcon={true}
        text={"Categories"}
        // text={collectionTitle}
        textinput={true}
      />
      <View style={{ width: "100%", height: 5, backgroundColor: whiteColor }}></View>

      <View style={[styles.container]}>
        <View style={[styles.productCollectionBox, { backgroundColor: isDarkMode ? themecolors.grayColor : "transparent" }]}>
          {loading ? <View style={styles.skeletonContainer}>
            {[...Array(6)].map((_, index) => (
              <View key={index} style={styles.skeletonItem}>
                <View style={styles.skeletonImage} />
                <View style={styles.skeletonText} />
              </View>
            ))}
          </View> :
            <FlatList
              data={collectionData?.collections.edges}
              renderItem={({ item }) => (
                <Pressable onPress={() => onPressCollection(item?.node.id, item?.node.title)} style={[alignItemsCenter, {
                  flexDirection: 'row', paddingleft: selectedCollectionId === item?.node.id ? 0 : 6,
                  backgroundColor: selectedCollectionId == item?.node.id ? "transparent" : lightGrayOpacityColor,
                  width: wp(23)
                }]}>
                  {selectedCollectionId === item?.node?.id && <View style={{ width: 5, backgroundColor: redColor, height: hp(10), borderTopRightRadius: 10, borderBottomRightRadius: 10, marginBottom: 25 }}>
                  </View>}
                  <View style={{ height: 'auto', padding: selectedCollectionId === item?.node.id ? spacings.small : spacings.small, alignItems: "center", justifyContent: "center", }}>
                    <View style={{
                      backgroundColor: whiteColor, borderWidth: selectedCollectionId === item?.node?.id ? 0 : 1,
                      borderRadius: 10, height: hp(10), overflow: "hidden", borderColor: selectedCollectionId === item?.node?.id ? redColor : themecolors.mediumGray, width: wp(15)
                    }}>
                      <Image source={{ uri: item?.node.image?.url }} style={[resizeModeCover, styles.card]} />
                    </View>
                    <Text style={[styles.categoryName, textAlign, { color: selectedCollectionId === item?.node?.id ? redColor : themecolors.blackColor }]}>{item?.node?.title}</Text>
                  </View>
                </Pressable>
              )}
              showsVerticalScrollIndicator={false}
              style={{ marginBottom: 70 }}
              keyExtractor={(index) => index.toString()}
            />}
        </View>
        <View style={[styles.productDetailsBox, { paddingBottom: isDarkMode ? spacings.xLarge : 0 }]}>
          {!loading ? <>
            <Text style={{ fontWeight: style.fontWeightThin1x.fontWeight, color: themecolors.blackColor, fontSize: style.fontSizeNormal2x.fontSize, padding: spacings.large }}>
              <Text style={{ fontWeight: style.fontWeightMedium1x.fontWeight, color: themecolors.blackColor, fontSize: style.fontSizeNormal2x.fontSize, padding: spacings.large }}>{products?.length} items
              </Text> in {collectionTitle}</Text>
            <FlatList
              data={products}
              renderItem={({ item, index }) => {
                return (
                  <Product
                    key={item?.id}
                    product={item}
                    onAddToCart={addToCartProduct}
                    loading={addingToCart?.has(getVariant(item)?.id ?? '')}
                    // inventoryQuantity={inventoryQuantities[index]}
                    option={options[index]}
                    ids={productVariantsIDS[index]}
                    saveIconTop={true}
                    width={wp(36.9)}
                    height={wp(55)}
                    spaceTop={4}
                    onPress={() => {
                      navigation.navigate('ProductDetails', {
                        product: item,
                        variant: getVariant(item),
                        // inventoryQuantity: inventoryQuantities[index],
                        tags: tags[index],
                        option: options[index],
                        ids: productVariantsIDS[index]
                      });
                    }}
                  />
                );
              }}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item?.id}
              numColumns={2}
            />
          </>
            :
            <SkeletonPlaceholder>
              <View style={[alignJustifyCenter, { height: hp(52) }]}>
                <View style={{ width: wp(100), height: 150, flexDirection: 'row', marginTop: 5, marginLeft: 60 }}>
                  {Array(2).fill().map((_, index) => (
                    <View key={index} style={{ width: wp(36), height: hp(58), marginTop: 50, marginRight: 10 }} />
                  ))}
                </View>
                {/* <LoaderKit
                style={{ width: 50, height: 50 }}
                name={LOADER_NAME}
                color={themecolors.blackColor}
              /> */}
              </View>
            </SkeletonPlaceholder>
          }
        </View>
      </View>
      {/* <ChatButton onPress={handleChatButtonPress} /> */}
    </ImageBackground>

  );
}

export default CatalogScreen;

function createStyles() {
  return StyleSheet.create({
    container: {
      width: wp(100),
      height: hp(90),

      flexDirection: "row"
    },
    productCollectionBox: {
      width: "23%",
      height: hp(88),
      paddingVertical: spacings.small,
      backgroundColor: lightGrayOpacityColor
    },
    productDetailsBox: {
      width: wp(78),
      height: hp(88),
      padding: spacings.small,
    },
    card: {
      width: "100%",
      height: "100%",
    },
    categoryName: {
      fontSize: style.fontSizeNormal.fontSize,
      color: blackColor,
      marginVertical: spacings.small,
      fontWeight: style.fontWeightThin1x.fontWeight,
    },
    text: {
      fontSize: style.fontSizeLarge.fontSize,
      fontWeight: style.fontWeightThin1x.fontWeight,
      color: blackColor,
    },
    drinkBannerBox: {
      width: wp(40.5),
      height: hp(20),
      margin: spacings.large,
    },
    skeletonContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
    },
    skeletonItem: {
      alignItems: 'center',
      marginVertical: 10,
    },
    skeletonImage: {
      width: wp(15),
      height: hp(10),
      backgroundColor: lightGrayOpacityColor,
      borderRadius: 10,
    },
    skeletonText: {
      width: wp(12),
      height: 10,
      backgroundColor: lightGrayOpacityColor,
      marginTop: 5,
      borderRadius: 5,
    },
  });
}
