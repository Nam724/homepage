import {View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Pressable} from 'react-native';
import { colorPack, styles, width } from '../style/style';


function Main_restaurantList(restaurant, num, navigation, place, setRestaurantList, restaurantList, refreshRestaurantList) {
  const backgroundColor_odd = colorPack.highlight_dark
  const backgroundColor_even = colorPack.highlight_light
  var myBackgroundColor
  if(Number(num) %2 == 0){
    myBackgroundColor = backgroundColor_even
  }
  else{
    myBackgroundColor = backgroundColor_odd
  }

  const id = restaurant.id
  const name = restaurant.name
  const fee = restaurant.fee
  const num_members = restaurant.num_members
  const makerID = restaurant.makerID
  const url = restaurant.url

  // console.log(restaurantList)

 // return 
  return (
    <View style={[styles.restaurantList,{backgroundColor:myBackgroundColor}]} 
    key={id}   
    >
    <TouchableOpacity
    onPress=  {() => {  
      navigation.navigate('Restaurant', {id: id, name: name, fee: fee, url: url, place: place, setRestaurantList:setRestaurantList, restaurantList:restaurantList, refreshRestaurantList:refreshRestaurantList})
      // console.log('pressed')
    }}
    >

      <Text style={[styles.highlightText, styles.restaurantName]} numberOfLines={1} ellipsizeMode='tail' 
      >{name}</Text>

      </TouchableOpacity>
      <Text style={[styles.normalText, styles.restaurantFee,]} ellipsizeMode='tail' numberOfLines={1}>{`배달료: 각${fee}원`}</Text>

      <Text style={[styles.normalText, styles.restaurantMembers]} ellipsizeMode='tail' numberOfLines={1}>{`00명`}</Text>

    </View>
  );  // return
}

function Main_restaurantList_sample(id, name, fee, num) {
  const backgroundColor_odd = colorPack.highlight_dark
  const backgroundColor_even = colorPack.highlight_light
  var myBackgroundColor
  if(Number(num) %2 == 0){
    myBackgroundColor = backgroundColor_even
  }
  else{
    myBackgroundColor = backgroundColor_odd
  }
 // return 
  return (
    <TouchableOpacity style={[styles.restaurantList,{backgroundColor:myBackgroundColor}]} key={id}
    disabled={true}
    >

      <Text style={[styles.highlightText, styles.restaurantName]}>{name}</Text>

      <Text style={[styles.normalText, styles.restaurantFee]}>{`${fee}`}</Text>

      <Text style={[styles.normalText, styles.restaurantMembers]}>{``}</Text>
      
    </TouchableOpacity>
  );  // return
}

export {Main_restaurantList, Main_restaurantList_sample}