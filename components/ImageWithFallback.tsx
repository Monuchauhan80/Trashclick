"use client"

import { useState } from 'react'
import Image, { ImageProps } from 'next/image'

interface ImageWithFallbackProps extends ImageProps {
  fallbackSrc?: string
}

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc = '/placeholder-image.jpg',
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [error, setError] = useState(false)

  return (
    <>
      <Image
        {...props}
        src={imgSrc}
        alt={alt}
        onError={() => {
          setImgSrc(fallbackSrc)
          setError(true)
        }}
      />
      {error && (
        <div className="text-xs text-red-500 mt-1">
          Original image could not be loaded. Using placeholder.
        </div>
      )}
    </>
  )
} 