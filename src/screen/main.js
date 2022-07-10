import { Auth } from 'aws-amplify';
import {View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Pressable, RefreshControl, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView} from 'react-native';
import {useState, useEffect} from 'react';
import { colorPack, map_darkStyle, styles, width, height } from '../style/style';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import DialogInput from 'react-native-dialog-input';
import {Main_restaurantList, Main_restaurantList_sample} from './main_restaurantList';
import  {DataStore} from '@aws-amplify/datastore';
import {Restaurant, Place, Member} from '../models';
import Loading_page from './loading_page';
import * as Linking from 'expo-linking';

export default function Main_page({route, navigation}){

  

  // console.log('route_params', route.params);

  const user = route.params.user.attributes;
  user.username = user.sub
  const setIsLogin = route.params.setIsLogin;
  const setUser = route.params.setUser;
  const setAutoLogin = route.params.setAutoLogin;
  // console.log('Main_page user', user);
// MAP
  // check is loading finished?
  const [isLoading, setIsLoading] = useState(true);

// get location
  const [location, setLocation] = useState(
    {latitude: 35.572676, longitude: 129.188191, latitudeDelta: 0.003, longitudeDelta: 0.003}
  ); // coordinate = {latitude: 37.4219525, longitude: -122.0837251}

  const [errorMsg, setErrorMsg] = useState(null);
  // const mapRef = createRef();

  useEffect( () => {
        // setIsLoading(true); // 주석 풀면 로딩창 뜸
        mountFunction();      
    }, []); 

  const mountFunction = async () => { // 시작할 때 실행되는 함수
    let { status_location_permission } = await Location.requestForegroundPermissionsAsync();
      console.log(status_location_permission);
      // 나중에 풀어야 함!
      if (status_location_permission !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        // return; 
      }

    let location = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.003, longitudeDelta: 0.003
    });
    // alert('getMarkers 이전')
    await getMarkers();
  }

    // refresh
  const [refreshing, setRefreshing] = useState(false);


  const refreshRestaurantList = async (id='refresh') => {
    setRefreshing(true);
    // console.log('refreshRestaurantList',id==='refresh');
    await getMarkers()
    if(id=='refresh'){
      // console.log('refreshRestaurantList_refresh');
      await loadRestaurant(selectedMarker.key);
    }
    else if(id == 'userOrder'){
      showUserOrderList();
    }
    else{
      // console.log('refreshRestaurantList_with id');
      await loadRestaurant(id);
    }
    setRefreshing(false);
  }




  const logOut = () => {
    Alert.alert('배달앤빵','로그아웃을 할까요?',[{text: '로그아웃', onPress: async () => {
      await Auth.signOut();
      setAutoLogin(false)
      setIsLogin(false);
      setUser(null);
    }},{text: '취소', onPress: () => {
    console.log('Cancel Pressed');
  }}]);
  }

  let text = 'Waiting..';
  if (errorMsg) {
    text = errorMsg;
  } 
  else if (location) {
    text = JSON.stringify(location);
  }
  // console.log(location)

  const returnMarker = (data) => {// data should contain id, name, latitude, longitude
    // console.log('makeMarker')
    let coordinate = {longitude: data.longitude, latitude: data.latitude};
    let title = data.name;
    let key = data.id;
    let createdAt = data.createdAt;
    let makerID = data.makerID
    let num_restaurants = data.num_restaurants;
    
    return (
      <Marker
        coordinate={coordinate}
        title={title}
        description={`${num_restaurants}개의 음식점`}
        key={key}
        onPress={() => {
          // console.log(key)
          setSelectedMarker(
            {
              coordinate: coordinate,
              title: title,
              key: key,
            }
          );
          loadRestaurant(key);
        }}
      />
    );
  }

//MARKER
  // current markers
  const [markers, setMarkers] = useState([]); // use makeMarker(data)

  async function getMarkers() {
    let _markerList = []

    const models = await DataStore.query(Place);

    models.forEach((model) => {_markerList.push(returnMarker(model))});
    setMarkers(_markerList);
    // console.log(_markerlist);
    setIsLoading(false);
  }

  // get log pressed location and add marker
  const [newmarkerCoordinate, setNewmarkerCoordinate] = useState(null);

  // make new marker
  async function makeNewMarker(coordinate, title){

    await DataStore.save(
      new Place({
      "latitude": coordinate.latitude,
      "longitude": coordinate.longitude,
      "name": title,
      "Restaurants_in_a_place": [],
      "makerID": user.username,
      "num_restaurants":0
      })
    );
    
    refreshRestaurantList();
    // console.log('saved');
  }

// selected marker info
  const [selectedMarker, setSelectedMarker] = useState({
    coordinate: {}, // {logitude: 0, latitude: 0}
    title: '',
    key: 'markers%',
  });

 // get marker name dialog
  const [dialogVisible_marker, setDialogVisible_marker] = useState(false); 




// RESTAURANT LIST
const restaurantList_sample = [
  Main_restaurantList_sample('placeholder1','장소 추가', '지도 길게 누르기', '0'),
  Main_restaurantList_sample('placeholder2','장소 선택', '핀 누르기', '1'),
]

  const [restaurantList, setRestaurantList] = useState(restaurantList_sample);


  // get restaurant list
  const [dialogVisible_restaurant, setDialogVisible_restaurant] = useState(false);

  // const [newRestaurant, setNewRestaurant] = useState({});
  const [newRestaurant_name, setNewRestaurant_name] = useState(null);
  const [newRestaurant_fee, setNewRestaurant_fee] = useState(0);
  const [newRestaurant_url, setNewRestaurant_url] = useState(null);
  const [newRestaurant_account, setNewRestaurant_account] = useState(user.address);

  // make new restaurant
  async function saveNewRestaurant(placeID){
      
    console.log({"name": newRestaurant_name,"fee": newRestaurant_fee,"url": newRestaurant_url,"placeID": placeID,})
    // amplify
    const restaurant = await DataStore.save(
      new Restaurant({
      "name": newRestaurant_name,
      "fee": (newRestaurant_fee==null)?0:parseInt(newRestaurant_fee),
      "url": newRestaurant_url,
      "placeID": placeID,
      "makerID": user.username,
      "num_members":1,
      "account": newRestaurant_account,
      "isFinishRecruiting": false,
    }));
    setNewRestaurant_name(null);
    setNewRestaurant_fee(null);
    setNewRestaurant_url(null);
    /* Models in DataStore are immutable. To update a record you must use the copyOf function
    to apply updates to the item’s fields rather than mutating the instance directly */
    const CURRENT_ITEM = await DataStore.query(Place, placeID);
    await DataStore.save(Place.copyOf(CURRENT_ITEM, updated => {
      // Update the values on {item} variable to update DataStore entry
      updated.num_restaurants = updated.num_restaurants + 1;
    }));

    // 자기 자신을 음식점에 추가
    await DataStore.save(
      new Member({
          "username": user.username,
          "email": user.email,
          "phone_number": user.phone_number,
          "menu": [''], 
          "fee":Number(0),
          "restaurantID": restaurant.id,
      })
    );

    await getMarkers();
    // console.log('markers', markers)
    refreshRestaurantList();
  }

  // load restaurant
  async function loadRestaurant(placeID){
    // console.log(placeID)
    const place = await DataStore.query(Place, placeID);

    const models = await DataStore.query(Restaurant, (q) => q.placeID('eq',placeID));
    // console.log(models);
    

    let _restaurantList = []

    models.sort((a,b) => {
      const price1 = a.fee/a.num_members;
      const price2 = b.fee/b.num_members;
      return price1 - price2;
    }).forEach( async(model, index) => {

      _restaurantList.push(
        Main_restaurantList(
          user,
          model,
          index,
          navigation,
          place,
          setRestaurantList,
          restaurantList,
          refreshRestaurantList        
        )
      )
    });
    setRestaurantList(_restaurantList);
  }

  const showUserOrderList = async() => {
    const members = await DataStore.query(Member, (q) => q.username('eq',user.username));
    //console.log(members);
    var _orderList = []
    members.forEach( async(member, index) => {

      let rest = await DataStore.query(Restaurant, member.restaurantID);
      let place = await DataStore.query(Place, rest.placeID);

      //console.log('rest', rest);
      //console.log('place', place);

      _orderList.push(Main_restaurantList(
        user,
        rest,
        index,
        navigation,
        place,
        setRestaurantList,
        restaurantList,
        refreshRestaurantList        
      ))

      if(index == members.length-1){
        setSelectedMarker({
          coordinate: {}, // {logitude: 0, latitude: 0}
          title: '나의 주문',
          key: 'user_order',
        })
        setRestaurantList(_orderList);
        //console.log('orderList', _orderList);
      }
    })
  }

 // return 
  return (
    isLoading?(
      <Loading_page></Loading_page>):(
    <View style={styles.container}>

      <DialogInput
        isDialogVisible={dialogVisible_marker}
        title={"이곳에 핀 추가하기"}
        message={'이 장소의 이름을 입력하세요'}
        dialogStyle={{
          borderRadius: width*50/1000,
          backgroundColor: colorPack.text_light,
          padding: width*20/1000,
        }}
        textInputProps={{
          autoCorrect: false,
          autoCapitalize: false,
          maxLength: 10,
        }}

        submitText={'저장'}
        cancelText={'닫기'}
        submitInput={(title) => {
          if(title){
          makeNewMarker(newmarkerCoordinate, title);
          setDialogVisible_marker(false);
          }
          else{
            setDialogVisible_marker(false);
          }
        }}
        closeDialog={() => {
          setDialogVisible_marker(false);
        }}
      />


      <Modal animationType='fade'
      transparent={false}
      visible={dialogVisible_restaurant}
      onRequestClose={() => {
        setDialogVisible_restaurant(false);
        setNewRestaurant_fee(null);
        setNewRestaurant_name(null);
        setNewRestaurant_url(null);
      }}
      >
      <Pressable style={{
        flex:1,
        backgroundColor: colorPack.representative,
      }}
      onPress={()=>
      {setDialogVisible_restaurant(false);
        setNewRestaurant_fee(null);
        setNewRestaurant_name(null);
        setNewRestaurant_url(null);}
      }
      />
      <KeyboardAvoidingView behavior='padding' keyboardVerticalOffset={height*50/2000}
      style={styles.restaurantInfoModal}>
      <ScrollView>
        
        <View style={styles.restaurantInfoContainerModal}>
          <View style={styles.header}>
          <Text style={[styles.highlightText]}>{`음식점을 \"${selectedMarker.title}\"에 추가합니다.`}</Text>
          </View>
          

          <View style={styles.getRestaurantInfoModal}>
          <TouchableOpacity
            onPress={() => {
              Linking.openURL('https://baeminkr.onelink.me/XgL8/baemincom');
          }}
            disabled={newRestaurant_url != null}
            
          >
          <Text style={[styles.normalText]}>{newRestaurant_url?'배달의 민족 링크':'배달의 민족으로 이동하기'}</Text>
          </TouchableOpacity>
            
            <TextInput
            style={styles.textInputBox}
            placeholder={'배달의 민족 URL 붙여넣기'}
            placeholderTextColor={colorPack.deactivated}
            value={newRestaurant_url}
            onChangeText={(text) => readClipboard(setNewRestaurant_name, setNewRestaurant_url, text)}
            >            
            </TextInput>
          </View>

          <View style={styles.getRestaurantInfoModal}>
            <Text style={[styles.normalText]}>{'음식점 이름'}</Text>
            <TextInput style={styles.textInputBox}
            value={newRestaurant_name}
            onChangeText={(text) =>
              setNewRestaurant_name(text)
            }
            placeholder='URL을 붙여넣으면 자동으로 입력됩니다.'
            placeholderTextColor={colorPack.deactivated}
            showSoftInputOnFocus={false}
            editable={false}
            />
          </View>

          <View style={styles.getRestaurantInfoModal}>
            <Text style={[styles.normalText]}>{'배달료(원)'}</Text>
            <TextInput style={styles.textInputBox}
            onChangeText={(text) => setNewRestaurant_fee(text)}
            keyboardType='numeric'
            placeholder='0'
            placeholderTextColor={colorPack.deactivated}            
            />
          </View>
          

          <View style={styles.getRestaurantInfoModal}>
            <TouchableOpacity
            onPress={() => {
              Alert.alert('배달앤빵','카카오톡 프로필 상단 우측의 QR코드 버튼을 누른 뒤 QR코드 밑에 있는 링크 아이콘을 클릭하세요.')
           }}
            disabled={newRestaurant_account != null}>

            <Text style={[styles.normalText,{textAlign:'center'}]}>{newRestaurant_account?'입금받을 본인 계좌':' 카카오페이 송금주소를 복사하는 방법 보기.'}</Text>
            </TouchableOpacity>
            <TextInput style={styles.textInputBox}
            onChangeText={(text) => setNewRestaurant_account(text)}
            placeholder= {user.address}
            placeholderTextColor={colorPack.text_light}
            editable={newRestaurant_account == null}  
            onKeyPress={(e) => {
              if (e.nativeEvent.key === 'return') {
                let placeID = selectedMarker.key;
                setDialogVisible_restaurant(false);
                saveNewRestaurant(placeID);
              }
            }}
            />

          </View>

          <View style={styles.buttonContainerModal}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => 
                { setDialogVisible_restaurant(false);
                  setNewRestaurant_fee(null);
                  setNewRestaurant_name(null);
                  setNewRestaurant_url(null);
                }}>
              <Text style={styles.highlightText}>{'취소'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => 
                { 
                  let placeID = selectedMarker.key;
                  setDialogVisible_restaurant(false);
                  saveNewRestaurant(placeID);
                }}>
              <Text style={styles.highlightText}>{'추가하기'}</Text>
            </TouchableOpacity>
          </View>
          
        </View>
        </ScrollView>
        </KeyboardAvoidingView>
        

      </Modal>



      <View style={[styles.header, {flexDirection:'row', justifyContent:'space-between'}]}>

        <View style={{width:width*0.25}}>
          <TouchableOpacity
            onPress={() => {
              logOut()
            }}
          >
          <Text style={styles.normalText} lineBreakMode='tail' numberOfLines={1}>{user.email.split('@')[0]}</Text>
          </TouchableOpacity>    
        </View>

        <TouchableOpacity style={{width:width*0.25}}
            onPress={async() => {
              await getMarkers();
              setSelectedMarker({
                coordinate: {}, // {logitude: 0, latitude: 0}
                title: '',
                key: 'markers%',
              });
              setRestaurantList(restaurantList_sample)
            }}
        >
          <Text style={styles.highlightText} lineBreakMode='tail' numberOfLines={1}>{'배달앤빵'}</Text>
        </TouchableOpacity>

        <View style={{width:width*0.25}}>
          <TouchableOpacity
            onPress={() => {
              showUserOrderList();
            }}
          >
          <Text style={styles.normalText} lineBreakMode='tail' numberOfLines={1}>{`나의 주문`}</Text>
          </TouchableOpacity>    
        </View>

      </View>

      
      <View style={styles.mapContainer}>

          <MapView
          provider='google'
          customMapStyle={map_darkStyle}
          style={styles.map}
          initialRegion={location}
          showsMyLocationButton={true}
          showsUserLocation={true}
          loadingEnabled={true}
          zoomEnabled={true}
          rotateEnabled={true}
          onLongPress={(e) => {
            setNewmarkerCoordinate(e.nativeEvent.coordinate);
            setDialogVisible_marker(true);
          }}
          >
          {markers}
          </MapView>

      </View>


      <View style={styles.restaurantContainer}>


          <View style={styles.locationInfoContainer}>
              <Text style={styles.highlightText}>
                {selectedMarker.title}
              </Text>
              <TouchableOpacity
                style={styles.locationInfoButton}
                onPressOut={() => {
                  {setDialogVisible_restaurant(true);}
                }}
                disabled={selectedMarker.key==='markers%'||selectedMarker.key==='user_order'}
              >
                <Text style={styles.normalText}>
                {selectedMarker.key==='markers%'?'장소를 먼저 선택하세요':(selectedMarker.key ==='user_order'?'':'이곳으로 배달할 음식점 추가하기')}
                </Text>
              </TouchableOpacity>
          </View>


          <SafeAreaView>
          <ScrollView style={styles.restaurantListContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={()=>{
                if(selectedMarker.key =='user_order'){
                  refreshRestaurantList('userOrder')
                }
                else if(selectedMarker.key =='markers%'){
                  setRestaurantList(restaurantList_sample)
                }
                else{
                  refreshRestaurantList('refresh');
                }

                // console.log('refresh')
              }
              }
            />
            }
          >
            {restaurantList}
          </ScrollView>          
          </SafeAreaView>




      </View>
    </View>
  ))

  }// return}

const readClipboard = async (setNewRestaurant_name, setNewRestaurant_url, innerText='') => {
  // const clipboardText = await Clipboard.getStringAsync('plainText');
  //클립보드의 내용을 가져온다 
  const clipboardText = innerText
  //console.log(clipboardText);


  const UrlFormat = /^\'(.*)\' 어때요\? 배달의민족 앱에서 확인해보세요.  https:\/\/baemin.me\/(.*){1,}$/g

  const restaurantTitleFormat = /\'.*\'/g
  const restaurantUrlFormat = /https:\/\/baemin.me\/(.*){1,}/g

  const restaurantTitle = clipboardText.match(restaurantTitleFormat);
  const restaurantUrl = clipboardText.match(restaurantUrlFormat);

  //console.log(clipboardText, restaurantTitle, restaurantUrl);
  if(restaurantTitle&&restaurantUrl){ 
  //클립보드에서 가져온 문자열에 http 가 포함되어있으면 링크로 인식해 저장
    setNewRestaurant_url(restaurantUrl[0]);
    setNewRestaurant_name(restaurantTitle[0].substring(1, restaurantTitle[0].length-1));
  }
  else{
      setNewRestaurant_url('');
      setNewRestaurant_name('');
      if(clipboardText){
          Alert.alert('배달앤빵', `현재 복사된 링크는 배달의민족 주소가 아닙니다!`, [{text: '확인'}]);
      }
      else{
          Alert.alert('배달앤빵','배달의민족 주소를 먼저 붙여넣어 주세요.',[{text: '확인'}])
      }

  }
};

