import { Image } from "react-native"

export const Logo = ({width, height}: { width: number, height: number }) => {
    return (
        <Image
            source={require('../assets/images/clapperboard.png')}
            style={{width: width, height: height, resizeMode: 'contain'}}
        />
    )
}