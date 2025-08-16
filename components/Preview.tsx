'use client'  
import { useEffect, useState } from 'react'
import { mdToPreviewHtml } from '@/lib/marp'

type Props = { markdown: string }

export default function Preview({ markdown }: Props) {
  const [html, setHtml] = useState<string>('')

  useEffect(() => {
    setHtml(mdToPreviewHtml(markdown))
  }, [markdown])

  return (
    <iframe
      srcDoc={html || undefined}
      className='w-full h-full bg-white'
      sandbox='allow-scripts allow-same-origin'
    />
  )
}