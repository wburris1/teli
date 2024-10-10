import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import ContentLoader, { Rect } from 'react-content-loader/native';

interface ImageWithSkeletonProps {
  uri: string;
  width: number;
  height: number;
  borderRadius: number;
  placeHolder: any;
}

const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({ uri, width, height, borderRadius, placeHolder }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View style={{ width, height }}>
      {!isLoading && (
        <ContentLoader
          viewBox={`0 0 ${width} ${height}`}
          speed={5}
          width={width}
          height={height}
          backgroundColor="gray"
          foregroundColor="white"
        >
          <Rect x="0" y="0" rx={borderRadius} ry={borderRadius} width={width} height={height} />
        </ContentLoader>
      )}

      <Image
        source={{uri: uri}}
        style={[styles.image, { width, height, borderRadius, opacity: 0 }]}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default ImageWithSkeleton;