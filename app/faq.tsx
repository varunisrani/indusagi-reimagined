'use client';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import faq from './data/faq.json';
export function FAQ(){return <Accordion type="single" collapsible defaultValue="q0" className="faq-list">{faq.map((item,i)=><AccordionItem key={item.question} value={'q'+i}><AccordionTrigger>{item.question}</AccordionTrigger><AccordionContent><p>{item.answer}</p></AccordionContent></AccordionItem>)}</Accordion>}
