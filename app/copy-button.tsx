'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
export function CopyButton({text,label='Copy'}:{text:string,label?:string}){const[status,setStatus]=useState('');async function copy(){try{await navigator.clipboard.writeText(text);setStatus('Copied');setTimeout(()=>setStatus(''),1800)}catch{setStatus('Select command to copy')}}return <button onClick={copy} className="copy-button" aria-label={'Copy '+text}>{status==='Copied'?<Check size={16}/>:<Copy size={16}/>}<span aria-live="polite">{status||label}</span></button>}
