import { Text, View } from "@/components/Themed";
import { Link } from "expo-router";
import { Image } from "react-native";

export default function CreditsScreen() {
    return (
        <View style={{flex: 1}}>
            <View style={{flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 10, alignItems: 'center', borderBottomWidth: 1, borderColor: 'gray'}}>
                <Image
                    source={require('@/assets/images/tmdbLogo.png')}
                    style={{width: 50, height: 50, resizeMode: 'contain', marginRight: 10}}
                />
                <Text style={{fontSize: 16, fontWeight: '300', flex: 1}}>This product uses the TMDB API but is not endorsed or certified by TMDB.</Text>
            </View>
            <View style={{flexDirection: 'row', padding: 10, alignItems: 'center', borderBottomWidth: 1, borderColor: 'gray'}}>
                <View style={{backgroundColor: 'white', borderWidth: 1, borderRadius: 50, alignItems: 'center', width: 50, height: 50, marginRight: 10, justifyContent: 'center'}}>
                    <Image
                        source={require('@/assets/images/clapperboard.png')}
                        style={{width: 35, height: 35, marginRight: 3, resizeMode: 'contain'}}
                    />
                </View>
                <View>
                    <Text style={{fontSize: 16, fontWeight: '300'}}>Logo source:</Text>
                    <Link href="https://www.flaticon.com/free-icons/director">
                        <Text style={{fontSize: 16, fontWeight: '300', flex: 1, color: 'blue'}}>Director icons created by Freepik - Flaticon</Text>
                    </Link>
                </View>
            </View>
        </View>
    )
}