---
title: "Lighthouse PoC"
author: 
  - Elena Richert
  - Lukas Röseler
date: "2025-07-10"
type: plain_page
always_allow_html: true
output:
  html_document:
    self_contained: false       # don’t inline – write out .js/.css
    keep_md:     true           # keep the .md
    lib_dir:     "htmlwidgets_libs"  # where to drop htmlwidgets.js & visNetwork deps
editor: visual
---



Test for folding menu

<details>

<summary>Example for ausklabbable Statistics Dingens</summary>

50.5

</details>


``` r
# lighthouse data
lh_link <- "https://docs.google.com/spreadsheets/d/1gUBU8s2de3nRVO9bHi3EJYMllcFR-MQ9Uyni1SPlEns/edit?gid=0#gid=0"
lh_link <- "https://spreadsheets.google.com/feeds/download/spreadsheets/Export?key=1gUBU8s2de3nRVO9bHi3EJYMllcFR-MQ9Uyni1SPlEns&exportFormat=xlsx"
lh <- openxlsx::read.xlsx(lh_link, sheet = "Effects Summaries")

# FRiDa (preliminary double-coded and validated FReD COS version)

frida_link <- "https://github.com/forrtproject/FReD-data/raw/refs/heads/main/2025-07-01_COSdata_validated.xlsx"
frida <- openxlsx::read.xlsx(frida_link)
```


``` r
# Group by discipline (in case you have more than one)
# lh %>%
#   group_by(discipline) %>%
#   do({
#     disc <- unique(.$discipline)
#     cat(sprintf("**%s**\n\n", disc))    # Bold header
#     
#     # Now, for each row (effect.original + description as list)
#     for (i in seq_len(nrow(.))) {
#       effect <- .$effect.original[i]
#       desc <- .$description[i]
#       # bullet point with effect and desc
#       cat(sprintf("- %s. %s\n", effect, desc))
#     }
#     cat("\n")  # Blank line after each discipline section
#     data.frame() # require some output for do()
#   })


lh %>%
  group_split(discipline) %>%
  walk(function(df) {
    # Print discipline as a bold header
    cat(sprintf("**%s**\n\n", df$discipline[1]))
    # Pretty bullet list with bolded effect name and indented description
    walk2(df$effect.original, df$description, function(effect, desc) {
      cat(sprintf("- __%s__  \n  %s\n\n", effect, desc))
    })
    cat("\n")
  })
```

```
## **Applied Linguistics**
## 
## - __Critical period hypothesis__  
##   Critical period** **hypothesis**. How grammar-learning ability changes with age, finding that it is intact to the crux of adulthood (17.4 years) and then declines steadily
## 
## - __Motivational role of L2 vision__  
##   Mental imagery of oneself as a successful language user in the future can enhance one’s motivation and performance
## 
## 
## **Behavioural Genetics**
## 
## - __5-HTTLPR__  
##   5-HTT Gene-by-Environment Interaction** (5-HTT G x E). Polymorphisms in the serotonin transporter gene-linked promoter region (5-HTTLPR) moderate the experience of depression after stressful life events. People homozygous for the “short” allele (s/s) are significantly more likely to experience depression than people homozygous for the “long” allele (l/l) after multiple stressful life events; heterozygotes (s/l) demonstrate an intermediate response
## 
## 
## **Cognitive Psychology**
## 
## - __Verbal overshadowing effect__  
##   In a series of six experiments, verbalising the appearance of previously seen visual stimuli impaired subsequent recognition performance
## 
## - __Age of acquisition effects - influence on free recall (pure block)__  
##   Early-acquired items are recalled more accurately than late-acquired items when early-acquired items are presented in a separate block and late-acquired items are presented in a separate block
## 
## - __Age of acquisition effects - influence on free recall (mixed block)__  
##   Early-acquired items are recalled more accurately than late-acquired items when early-acquired items are mixed with late-acquired items in a block
## 
## - __Age of acquisition effects - influence on recognition (mixed block)__  
##   Early-acquired items are recalled more accurately than late-acquired items
## 
## - __Age of acquisition influence on the pre-conceptual stages of lexical retrieval (progressive demasking)__  
##   Age of acquisition influences the pre-conceptual stages of lexical retrieval (progressive demasking). **Early-acquired items are identified more accurately than late-acquired items, using a progressive demasking task. A progressive demasking task is a type of perceptual identification task where participants are presented with a series of words that are gradually revealed over time and their ability to identify words at each stage of the task is measured. Words learned at an earlier age are thought to be easier to demask than those learned later in life, perhaps because the individual has gained more experience and exposure to the word, which can make it easier to recognize
## 
## - __Age of acquisition influence on the pre-conceptual stages of lexical retrieval (object decision)__  
##   The age at which one acquires the concept of an object does not contribute to the speed and accuracy of recognising whether an object is a real object or not a real world object that has chimeric features
## 
## - __Age of acquisition influence on the pre-conceptual stages of lexical retrieval (anagram solution)__  
##   Age of acquisition is thought to affect lexical retrieval through its impact on anagram (word jumbles) solutions, such that words acquired at an earlier age tend to be solved more quickly and accurately in anagram tasks than those learned later in life. This may be because words learned earlier in life are more deeply encoded and may therefore be more easily accessed
## 
## - __Age of acquisition influence on the pre-conceptual stages of lexical retrieval (visual duration threshold)__  
##   Early-acquired items are identified more accurately than late-acquired items, using visual duration threshold task
## 
## - __Age of acquisition influence on the pre-conceptual stages of lexical retrieval (category verification)__  
##   The age at which one acquires an object does not contribute to the speed and accuracy of category verification during a semantic categorisation task (where objects have to be decided whether they represent one group or another, e.g. tools vs. furniture
## 
## - __Age of acquisition influence on the pre-conceptual stages of lexical retrieval (category falsification)__  
##   The age at which one acquires the name of an object object does not contribute to the speed and accuracy of category falsification (i.e. deciding that a different word and the picture of the acquired concept do not match; e.g. the picture of the acquired concept of a rabbit, paired with the non-matching word “mouse”
## 
## - __Age of acquisition influence on face recognition__  
##   Early-acquired faces are recognised more quickly and accurately than late-acquired faces
## 
## - __Age of acquisition influence on familiarity decision__  
##   Age of acquisition influence on face familiarity decision. **Early-acquired faces are recognised as familiar faces more quickly than late-acquired faces when the task is to discriminate between familiar and unfamiliar faces
## 
## - __Age of acquisition influence on face gender decision__  
##   The age at which a celebrity face is acquired does not affect the speed to recognise a celebrity’s face, using a gender decision task (is this face male or female
## 
## - __Age of acquisition influence on semantic decision__  
##   Early-acquired semantic concepts are categorised more quickly and accurately than later acquired concepts
## 
## - __Age of acquisition influence on the conceptual stages of lexical retrieval in opaque languages (spoken picture naming in opaque languages)__  
##   Age of acquisition influence on the conceptual stages of lexical retrieval in opaque languages (spoken picture naming in opaque language). **Early-acquired objects are named more quickly and accurately than late-acquired objects in opaque languages or deep orthography (i.e. spelling-sound correspondence is not direct where one is able to pronounce the word correctly based on the spelling; e.g. English, French
## 
## - __Age of acquisition influence on the conceptual stages of lexical retrieval in logographic languages (spoken picture naming in logographic languages)__  
##   Early-acquired names of objects are produced more quickly and accurately than late-acquired names in logographic languages such as Japanese and Chinese
## 
## - __Age of acquisition influence on the conceptual stages of lexical retrieval in transparent languages (spoken picture naming in transparent languages)__  
##   Age of acquisition influence on the conceptual stages of lexical retrieval in transparent languages (spoken picture naming in transparent language). **Early-acquired objects are named more quickly and accurately than late-acquired objects in transparent languages or shallow orthography (i.e. spelling-sound correspondence is direct where one is able to pronounce the word correctly based on the spelling; e.g. Spanish, Turkish, Italian
## 
## - __Age of acquisition influence on the conceptual stages of lexical retrieval (written picture naming)__  
##   Early-acquired object names are written more quickly and accurately than late-acquired names
## 
## - __Age of acquisition influence on the conceptual stages of lexical retrieval (typing)__  
##   Age of acquisition influence on the conceptual stages of lexical retrieval (typing). **Early-acquired object names are typed more quickly than late-acquired object names. Typing allows more precise measure for the response execution, while written picture naming is a measure for lexical retrieval
## 
## - __Age of acquisition influence on the post-conceptual stages of lexical retrieval (delayed spoken picture naming)__  
##   Age of acquisition influence on the post-lexical stages of lexical retrieval (delayed spoken picture naming). **Early-acquired words should not differ from late-acquired words in terms of accuracy and response speed of spoken naming, when using a delayed picture naming task that requires participants to name a picture a few seconds (e.g. 2-4 sec) after seeing the actual picture. This task enables researchers to assess if any possible delay of naming effects result at an articulatory level, as opposed to a conceptual level or lexical retrieval stage
## 
## - __Age of acquisition influence on the post-lexical stages of lexical/sublexical retrieval (delayed spoken word naming)__  
##   Early-acquired words should not differ from late-acquired words, when using delayed word naming. This enables researchers to assess if the lexical/sublexical effects result at an articulatory level
## 
## - __Age of acquisition influence on lexical retrieval (written word naming)__  
##   Early-acquired words are written and spelled more quickly and accurately than late-acquired words. In contrast to written picture naming, written word naming involves access to the lexical and sublexical pathways that are not accessed in typing or written picture naming
## 
## - __Age of acquisition influence on lexical retrieval (Immediate spoken word naming in opaque language)__  
##   Age of acquisition influence on lexical retrieval in opaque languages (Immediate spoken word naming in opaque language). **Early-acquired words are named more quickly and accurately than late-acquired words in opaque languages or deep orthography (i.e. spelling-sound correspondence is not direct where one is able to pronounce the word correctly based on the spelling; e.g. English, French
## 
## - __Age of acquisition influence on lexical retrieval (Immediate spoken word naming in transparent language)__  
##   Age of acquisition influence on lexical retrieval (Immediate spoken word naming in transparent language). **Early-acquired words are named more quickly and accurately than late-acquired words in transparent languages or shallow orthography (i.e. spelling-sound correspondence is direct where one is able to pronounce the word correctly based on the spelling; e.g. Italian, Spanish
## 
## - __Age of acquisition influence on lexical retrieval (spoken character naming in logographic languages)__  
##   Age of acquisition influence on lexical retrieval in logographic languages (spoken character naming in logographic languages). **Early-acquired characters are named more quickly and accurately than late-acquired characters in logographic languages such as Japanese and Chinese
## 
## - __Age of acquisition influence on speeded phonological retrieval (speeded spoken word naming)__  
##   Age of acquisition influence on speeded phonological retrieval. **Early-acquired words are responded to more quickly and accurately than late-acquired words, using a speeded naming paradigm, where participants must name the items as quickly as possible within a short timeframe (e.g. 400 milliseconds). This effect is argued to reduce the influence of semantics on phonological activation, which is argued to accumulate over the word naming process
## 
## - __Age of acquisition influence on lexical retrieval (auditory lexical decision task in opaque languages)__  
##   Early-acquired words are heard and responded to more quickly and accurately than late-acquired words, using auditory lexical decision tasks where participants have to judge whether they heard a real word or not
## 
## - __Age of acquisition influence on lexical retrieval (visual lexical decision in opaque languages)__  
##   Early-acquired words are seen and responded more quickly and accurately than late-acquired words in opaque languages or deep orthography (i.e. spelling-sound correspondence is not direct where one is able to pronounce the word correctly based on the spelling; e.g. English, French), using visual lexical decision task. Participants have to decide whether they saw a word or not
## 
## - __Age of acquisition influence on lexical retrieval (Visual lexical decision in transparent languages)__  
##   Age of acquisition influence on lexical retrieval (Visual lexical decision in transparent language). **Early-acquired words are responded more quickly and accurately than late-acquired words in transparent languages or shallow orthography (i.e. spelling-sound correspondence is direct where one is able to pronounce the word correctly based on the spelling; e.g. Spanish, Turkish, Italian
## 
## - __Age of acquisition influence on lexical retrieval (Visual lexical decision in logographic languages)__  
##   Early-acquired logograms are responded more quickly and accurately than late-acquired logograms in logographic languages such as Chinese and Japanese, using a visual lexical decision task
## 
## - __Age of acquisition influence on silent reading (eye-tracking)__  
##   Early-acquired words show shorter fixations, gaze and total reading times than late-acquired words in sentences and paragraphs, using eye-tracking
## 
## - __Age of acquisition influence on name retrieval__  
##   The earlier an individual learns a celebrity name and face, the more quickly and accurately the participant will name the celebrity
## 
## - __Age of acquisition on lexical-semantic processes (translation task)__  
##   Compared to late-acquired words, early-acquired words in a native or other language are translated more quickly to the other language or the native language, respectively
## 
## - __Age of acquisition influence on lexical-semantic processes (picture-word interference)__  
##   The pictures of objects whose concept is acquired earlier show smaller semantic interference with simultaneously appearing semantically related words, compared to when the task is done using pictures of objects whose concept is acquired later
## 
## - __Age of acquisition influence on lexical change__  
##   In contrast to the meaning of late-acquired words,** **the meaning of early-acquired words are less likely to change over time in the conceptual representation of the speaker and community
## 
## - __Age of acquisition influence on learning (conceptual learning)__  
##   The earlier a concept is learned, the more likely the concept will be more strongly consolidated and more likely to be recalled
## 
## - __Age of acquisition influence on learning (procedural learning)__  
##   Age of acquisition influence on learning (procedural). **The order of learning new actions of a procedures influences the speed and accuracy of recalling the correct position
## 
## - __Frequency effects on memory - influence on free recall (pure block)__  
##   High frequency items are recalled more accurately than low-frequency items when high-frequency items are presented in a separate block and low-frequency items are presented in a separate block
## 
## - __Frequency effects on memory - influence on free recall (mixed block)__  
##   High-frequency items are recalled more accurately than High-frequency items when early-acquired items are mixed with late-acquired items in a block
## 
## - __Frequency effects on memory - influence on recognition (mixed block)__  
##   High-frequency items are recognised more accurately than low-frequency items
## 
## - __Frequency influence on the pre-conceptual stages of lexical retrieval (progressive demasking)__  
##   Frequency influences the pre-conceptual stages of lexical retrieval (progressive demasking). **High-frequency items are identified more accurately than low-frequency items, using a progressive demasking task. A progressive demasking task is a type of perceptual identification task where participants are presented with a series of words that are gradually revealed over time and their ability to identify words at each stage of the task is measured. Words learned at an earlier age are thought to be easier to demask than those learned later in life, perhaps because the individual has gained more experience and exposure to the word, which can make it easier to recognize
## 
## - __Frequency influence on the pre-conceptual stages of lexical retrieval (object decision)__  
##   The age at which one acquires the concept of an object does not contribute to the speed and accuracy of recognising whether an object is a real object or not a real world object that has chimeric features
## 
## - __Frequency influence on the pre-conceptual stages of lexical retrieval (category verification)__  
##   The frequency that a person encounters a word or object does not contribute to the speed and accuracy of category verification during a semantic categorisation task (where objects have to be decided whether they represent one group or another, e.g. tools vs. furniture
## 
## - __Frequency influence on the pre-conceptual stages of lexical retrieval (category falsification)__  
##   The frequency that a person encounters a word or object does not contribute to the speed and accuracy of category falsification (i.e. deciding that a different word and the picture of the acquired concept do not match; e.g. the picture of the acquired concept of a rabbit, paired with the non-matching word “mouse”
## 
## - __Frequency influence on semantic decision__  
##   High-frequency semantic concepts are categorised more quickly and accurately than low-frequency concepts
## 
## - __Frequency influence on the conceptual stages of lexical retrieval in opaque languages (spoken picture naming in opaque languages)__  
##   Frequency influence on the conceptual stages of lexical retrieval in opaque languages (spoken picture naming in opaque language). **High-frequency objects are named more quickly and accurately than low-frequency objects in opaque languages or deep orthography (i.e. spelling-sound correspondence is not direct where one is able to pronounce the word correctly based on the spelling; e.g. English, French
## 
## - __Frequency influence on the conceptual stages of lexical retrieval in logographic languages (spoken picture naming in logographic languages)__  
##   High-frequency names of objects do not differ in naming latencies to low-frequency names in logographic languages such as Japanese and Chinese
## 
## - __Frequency influence on the conceptual stages of lexical retrieval in transparent languages (spoken picture naming in transparent languages)__  
##   Frequency influence on the conceptual stages of lexical retrieval in transparent languages (spoken picture naming in transparent language). **High-frequency objects are named more quickly and accurately than low-frequency objects in transparent languages or shallow orthography (i.e. spelling-sound correspondence is direct where one is able to pronounce the word correctly based on the spelling; e.g. Spanish, Turkish, Italian
## 
## - __Frequency influence on the conceptual stages of lexical retrieval (written picture naming)__  
##   High-frequency object names do not significantly differ in terms of written latencies to low-frequency names
## 
## - __Frequency influence on the conceptual stages of lexical retrieval (typing)__  
##   Frequency influence on the conceptual stages of lexical retrieval (typing). **The frequency of the object does not contribute to typing latencies. Typing allows more precise measure for the response execution, while written picture naming is a measure for lexical retrieval
## 
## - __Frequency influence on the post-conceptual stages of lexical/sublexical retrieval (delayed spoken word naming)__  
##   Frequency influence on the post-lexical stages of lexical/sublexical retrieval (delayed spoken word naming). **Early-acquired words should not differ from late-acquired words, when using delayed word naming. This enables researchers to assess if the lexical/sublexical effects result at an articulatory level
## 
## - __Word frequency influence on lexical retrieval (written word naming)__  
##   High-frequency words are written and spelled more quickly and accurately than low-frequency words. In contrast to written picture naming, written word naming involves access to the lexical and sublexical pathways that are not accessed in typing or written picture naming
## 
## - __Frequency influence on lexical retrieval (Immediate spoken word naming in opaque language)__  
##   Frequency influence on lexical retrieval in opaque languages (Immediate spoken word naming in opaque language). **High-frequency words are named more quickly and accurately than low-frequency words in opaque languages or deep orthography (i.e. spelling-sound correspondence is not direct where one is able to pronounce the word correctly based on the spelling; e.g. English, French
## 
## - __Frequency influence on lexical retrieval (Immediate spoken word naming in transparent language)__  
##   Frequency influence on lexical retrieval (Immediate spoken word naming in transparent language). **High-frequency words are named more quickly and accurately than low-frequency words in transparent languages or shallow orthography (i.e. spelling-sound correspondence is direct where one is able to pronounce the word correctly based on the spelling; e.g. Italian, Spanish
## 
## - __Frequency influence on lexical retrieval (spoken character naming in logographic languages)__  
##   Frequency influence on lexical retrieval in logographic languages (spoken character naming in logographic languages). **High-frequency characters are named more quickly and accurately than low-frequency characters in logographic languages such as Japanese and Chinese
## 
## - __Frequency influence on speeded phonological retrieval (speeded spoken word naming)__  
##   Frequency influence on speeded phonological retrieval. **High-frequency words are responded to more quickly and accurately than low-frequency words, using a speeded naming paradigm, where participants must name the items as quickly as possible within a short timeframe (e.g. 400 milliseconds). This effect is argued to reduce the influence of semantics on phonological activation, which is argued to accumulate over the word naming process
## 
## - __Frequency influence on lexical retrieval (auditory lexical decision task)__  
##   High-frequency words are heard and responded to more quickly and accurately than low-frequency words, using auditory lexical decision tasks where participants have to judge whether they heard a real word or not
## 
## - __Frequency influence on lexical retrieval (visual lexical decision in opaque languages)__  
##   High-frequency words are seen and responded more quickly and accurately than low-frequency words in opaque languages or deep orthography (i.e. spelling-sound correspondence is not direct where one is able to pronounce the word correctly based on the spelling; e.g. English, French), using visual lexical decision task. Participants have to decide whether they saw a word or not
## 
## - __Frequency influence on lexical retrieval (Visual lexical decision in transparent languages)__  
##   Frequency influence on lexical retrieval (Visual lexical decision in transparent language). **High frequency words are responded more quickly and accurately than low frequency words in transparent languages or shallow orthography (i.e. spelling-sound correspondence is direct where one is able to pronounce the word correctly based on the spelling; e.g. Spanish, Turkish, Italian
## 
## - __Frequency influence on lexical retrieval (Visual lexical decision in logographic languages)__  
##   High frequency logograms are responded more quickly and accurately than low frequency logograms in logographic languages such as Chinese and Japanese, using a visual lexical decision task
## 
## - __Frequency influence on silent reading (eye-tracking)__  
##   High-frequency words show shorter fixations, gaze and total reading times than low-frequency words in sentences and paragraphs, using eye-tracking
## 
## - __Frequency on lexical-semantic processes (translation task)__  
##   Compared to low-frequency words, high-frequency words in a native or other language are translated more quickly to the other language or the native language, respectively
## 
## - __Frequency influence on lexical-semantic processes (picture-word interference)__  
##   The word distractor more frequently show smaller semantic interference with simultaneously appearing semantically related words, compared to when the task is done with words encountered less frequently
## 
## - __Frequency influence on lexical change__  
##   In contrast to the meaning of early-acquired words,** **the meaning of high-frequency words are less likely to change over time in the conceptual representation of the speaker and community
## 
## - __Lateralisation of emotional processing with a chimeric face procedure__  
##   Participants are shown two faces: a neutral and emotional face on either the left or right side. There is a left-sided bias when choosing the face that presents itself as happy
## 
## - __Asymmetries in visual search__  
##   Participants are faster to respond to unknown targets defined by the presence, not absence, of a feature
## 
## - __Doodling increases intentional memory__  
##   Doodling increases intentional memory related to a pre-recorded audio message
## 
## - __Switching perspective provides new information__  
##   Switching perspective provides new information related to a previous passage
## 
## - __Better than chance recognition of old object pairs__  
##   There is an above-chance recognition of old objects in an old-new pairs when presenting context of state pairs
## 
## - __Worse performance after feedback than no feedback__  
##   Performance following ‘correct’ / ‘incorrect’ feedback is worse than providing no feedback
## 
## - __Shift behaviour after losses than wins__  
##   The percentage of shift behaviour is larger following losses relative to wins
## 
## - __Letter categorisation after rotation__  
##   Participants take longer to complete** **letter categorization as the letter is rotated away from its original/canonical position
## 
## - __Production effect on free recall in pure list__  
##   Words produced are unlikely to be recalled than words heard. This occurs when the two conditions are presented in different lists. For instance, lists containing only silently read or only read aloud items
## 
## - __Production effect on free recall in mixed list__  
##   Words produced are more likely to be recalled than words heard. This occurs when the two conditions are presented in the same list. For instance, list 1 has items both silently read and read aloud
## 
## - __Social production effect on free recall__  
##   Words produced are more likely to be recalled than words heard. However, the effect is smaller when the word is produced by the another person, as opposed to the self
## 
## - __Production effect in text reading__  
##   Words produced are more likely to be recalled than words heard when read as a sentence
## 
## - __Syntactic predictability in young adults__  
##   Young adults are more likely to be facilitated during reading when the sentence is presented with an _either _than when the sentence does not have an _either _included
## 
## - __Syntactic predictability in older adults__  
##   Older adults are more likely to be facilitated during reading when the sentence is presented with an _either _than when the sentence does not have an _either _included
## 
## - __Ego depletion__  
##   Self-control is a limited resource that can be depleted by efforts to inhibit a thought, emotion or behaviour
## 
## - __Dunning-Kruger effect__  
##   A cognitive bias whereby people with limited knowledge or competence in a given intellectual or social domain greatly overestimate their own knowledge or competence in that domain relative to objective criteria or to the performance of their peers or of people in general. Involves five claims, three of which are just popular misunderstandings: 1) the one the authors actually make: that poor performers (e.g. the bottom quartile) overestimate their performance more than good performers do: L > U
## 
## - __Depressive realism effect__  
##   Increased predictive accuracy or decreased cognitive bias among the clinically depressed
## 
## - __Hungry judge effect__  
##   Massively reduced acquittals just before lunch. Case order isn’t independent of acquittal probability (“unrepresented prisoners usually go last and are less likely to be granted parole”); favourable cases may take predictably longer and so are pushed until after recess; effect size is implausible on priors; explanation involved ego depletion
## 
## - __Multiple intelligences__  
##   This theory suggests that there are multiple types of intelligence that can be distinguished from one another, rather than a single general intelligence that underlies all cognitive abilities. Some of the proposed types of intelligence by Gardner are linguistic intelligence, logical-mathematical intelligence, musical intelligence, bodily-kinesthetic intelligence, interpersonal intelligence, intrapersonal intelligence, and naturalistic intelligence More broadly, this theory can be taken to suggest people have different cognitive strengths and weaknesses
## 
## - __Brain training on intelligence - far transfer from daily computer training games to fluid intelligence__  
##   Transfer of knowledge and skills ** **from daily computer training games to fluid intelligence in general, in particular from the Dual n-Back game
## 
## - __Brain training on intelligence - music lessons improve intelligence__  
##   An original experimental study found an increase in IQ for children who received a year of music lessons, compared to children who were randomly assigned to drama lessons or no lessons
## 
## - __Brain training on intelligence - Videogame play enhances psychomotor skills__  
##   Playing videogames (gaming) improves psychomotor skills, which are often operationalised by hand-eye coordination
## 
## - __Brain training on intelligence - Videogame play enhances spatial skills__  
##   Playing videogames (gaming) improves spatial skills, such as cognitive orientation and visualisation in space
## 
## - __Brain training on intelligence - Videogame play improves inspection and reaction time__  
##   Playing videogames (gaming) improves the ability to reliably identify and react to stimuli, i.e. inspection and reaction times
## 
## - __Brain training on intelligence - Videogame play improves intelligence (IQ)__  
##   Playing videogames (gaming) improves intelligence (IQ
## 
## - __Brain training on intelligence - Videogame play improves cognitive control and processing__  
##   Playing videogames (gaming) improves the processing speed of cognitive tasks
## 
## - __Brain training on intelligence - Videogame play improves memory__  
##   Playing videogames (gaming) improves various types of memory
## 
## - __Bilingual advantages in executive control - Inhibition__  
##   Bilingual advantages in executive control - inhibition. **Speaking two languages improves general cognitive control processes (executive control
## 
## - __Bilingual executive control effect - Non-verbal task switching__  
##   Bilingual advantages in executive control - Non-verbal task switching**. The idea that bilingual language switching on a daily basis makes bilinguals better at general non-verbal task switching, compared to monolinguals who do not perform this extensive daily language switching
## 
## - __Bilingual advantages in social communication - Theory of mind__  
##   Bilingual advantages - theory of mind. ** Bilingual children are more likely to score higher in Theory of Mind tasks than monolingual counterparts, using an unexpected transfer task
## 
## - __Bilingual advantages in social communication - perspective taking in referential communication__  
##   Bilingual advantages - perspective taking in referential communication**. Bilingual children are more likely to score higher in Director tasks than monolingual counterparts, using the director task
## 
## - __Exposure to another language advantage in social communication - Perspective taking in referential communication__  
##   Exposure to another language in social communication - perspective taking in referential communication**. Children who are exposed to a second language are more likely to score higher in Director tasks than children who are not exposed to a second language, using the director task
## 
## - __Bilingualism disadvantages in creativity - Fluency__  
##   Bilingualism disadvantages in creativity- fluency.** Monolinguals are more likely to rapidly produce a large number of ideas or solutions to a problem than bilinguals, using the Torrance Test
## 
## - __Monolingualism advantages in creativity - Flexibility__  
##   Monolingualism advantages in creativity - Flexibility.** Monolinguals are more likely to consider a variety of approaches to a problem simultaneously than bilinguals, using the Torrance Test
## 
## - __Null bilingualism advantages in creativity - Originality__  
##   Null Bilingualism advantages in creativity - Originality.** There should be no difference between bilinguals and monolinguals in the tendency to produce ideas different from those of most other people, using the Torrance Test. ​
## 
## - __Null bilingualism advantages in creativity - Elaboration__  
##   There should be no difference between bilinguals and monolinguals in the tendency to think through the details of an idea, using the Torrance Test
## 
## - __Bilingualism deficit in lexical retrieval__  
##   Compared to monolinguals, bilinguals have often been found to be slower or less accurate in accessing the meaning of a certain word or the word for a certain representation under certain conditions. ​
## 
## - __Mozart effect__  
##   Listening to Mozart’s sonata for two pianos in D major (KV 448) enhances performance on spatial tasks in standardised tests
## 
## - __Vivaldi effect__  
##   Increased cognitive performance after listening to musical excerpts composed by Vivaldi (similar to Mozart effect
## 
## - __Education enhances intelligence__  
##   Education has a consistent positive effect on intelligence. A meta-analysis suggests that one additional year of education corresponds to a gain of approximately 1 to 5 IQ points (contingent on study design, inclusion of moderators, and publication-bias correction
## 
## - __Automatic imitation__  
##   The observation of the topographical features of an action facilitates the execution of a similar action in the observer. Humans are prone to automatically imitate others. Automatic imitation differs from spatial compatibility effects and provides an important tool for the investigation of the mirror neuron system, motor mimicry, and complex forms of imitation
## 
## - __Congruency sequence effect__  
##   conflict adaptation or Gratton effect). A cognitive phenomenon in which the processing of stimuli is affected by the stimuli that preceded it e.g. congruency effects are smaller following incongruent trials rather than congruent trials
## 
## - __Action-sentence Compatibility Effect__  
##   ACE). **Participants’ movements are faster when the direction of the described action (e.g., Mark dealt the cards to you) matches the response direction (e.g., toward
## 
## - __The attentional spatial-numerical association of response codes (Att-SNARC) effect__  
##   The **attentional spatial-numerical association of response codes (Att-SNARC) effect. **The finding that participants had quicker detects to left-side targets preceded by small numbers and to the right-side targets preceded by large numbers. This finding triggered many assumptions about the number representations grounded in body experience
## 
## - __SPoARC effect__  
##   Spatial-Positional Association of Response Codes; Ordinal position effect). Responses from the left hand appear to be faster when the numbers to be remembered were shown at the beginning of the presentation phase, while the responses from the right hand appear to be faster when the to-be-remembered numbers were presented at the end
## 
## - __MARC effect__  
##   Markedness of response codes, Linguistic markedness of response codes). Responses to even numbers appear to be faster on the right-hand side, while responses to odd numbers appear to be faster on the right-hand side
## 
## - __Scarcity effect - Attention__  
##   Scarcity effect - _Attention_. **Having too little resources leads individuals to misallocate attention, leading to consequences such as overborrowing. Study 1 examined whether scarcity causes greater cognitive fatigue, measured by poorer performance on a cognitive ability task.​
## 
## - __Scarcity effect - Meaning in life__  
##   Scarcity effect - _Meaning in life_**. Threats to people’s sense that they can afford things that they need in the present and foreseeable future, undermines perceptions of meaning in life.​
## 
## - __Scarcity effect - Discounting__  
##   Scarcity effect - _Discounting_**. A negative income shock was associated with increased discounting rates for gains and loses.​
## 
## - __Scarcity effect - Physical pain__  
##   Scarcity effect - _Physical pain_. **The higher the economic insecurity is associated with the higher the physical pain
## 
## - __Scarcity effect - Self expansion__  
##   Scarcity effect -** **_Self expansion. _**Lower self-concept clarity (conceptualised as a finite resource) is associated with lower self-expansion.​
## 
## - __Scarcity effect - Wellbeing__  
##   Scarcity effect** **-_ Wellbeing. _**Imagining having less time available in one’s current city is positively associated with well-being.​
## 
## - __Scarcity effect - Decision making__  
##   Scarcity effect - _Decision making. _** Lacking time or money can lead to making worse decisions.​
## 
## - __Scarcity effect - Opportunity costs__  
##   Scarcity effect** **- _Opportunity costs._** Poor people are more likely to consider opportunity costs spontaneously
## 
## - __Scarcity effect - Conscious thoughts__  
##   Scarcity effect -_ Conscious thoughts._** Thoughts triggered by financial concerns intrude more often into consciousness of poorer individuals than for wealthier individuals.​
## 
## - __Scarcity effect - Absoluteness of losses__  
##   Scarcity effect -_ Absoluteness of losses_.** Poorer individuals view losses in more absolute, rather than relative, terms than do wealthier individuals.​
## 
## - __Bottomless soup bowl__  
##   Visual cues related to portion size increase intake volume of soup
## 
## - __Simon effect__  
##   Faster responses are observed when the stimulus and response are on the same side than when the stimulus and response are on opposite sides
## 
## - __ERPs in lie detection - P300 and guilty knowledge__  
##   ERPs in lie detection**. Particularly the P300 ERP component has been related in literature using Guilty Knowledge Tests to conscious recognition of crime-related targets as meaningful and salient stimuli, based on crime-related episodic memories
## 
## - __Evaluative conditioning__  
##   Implicit and explicit attitudes are differently sensitive to different kinds of information. Explicit attitude are formed and changed in response to the valence of consciously accessible, verbally presented behavioural information and implicit attitudes are formed and changed in response to the valence of subliminally presented primes.​
## 
## - __Nostalgia as a positive emotional experience__  
##   Nostalgia** **as a positive emotional experience. **A predominantly positive, albeit bittersweet emotion that arises from personally relevant and longful memories of one’s past. Nostalgia was once considered a disease or mental illness, but it has been shown to counteract loneliness, boredom and anxiety
## 
## - __Spacing effect__  
##   Long-term memory is enhanced when learning events are spaced apart in time rather than massed in immediate succession.​
## 
## - __False memories - eyewitness testimony__  
##   A phenomenon of recalling a real event that differs from what actually happened or an event that never occurred
## 
## - __Context-dependent memories__  
##   The improved recall or recognition of information when cues in the environment are the same during both encoding and retrieval
## 
## - __Motor priming__  
##   Motor priming refers to the phenomenon where a previous motor action influences the subsequent execution of a motor task. Scientific findings have shown that motor priming can have a moderate to large effect on task performance. It's also important to note that the effect size of motor priming can depend on the specific task being used, the population being studied, and the experimental design
## 
## - __Associative priming__  
##   Involves using two stimuli that are normally associated with one another. For example, “apple” and “tree” are two words that can be linked with one another in memory, so if only one of the words appears, it can prime the subject to respond more rapidly when the second word appears
## 
## - __Repetition priming__  
##   classification or identification of stimulus is improved when the same stimulus has been presented previously
## 
## - __Semantic priming__  
##   a facilitation in responding to target words such as doctor when preceded by a semantically related prime such as nurse than a semantically unrelated prime such as bread
## 
## - __Masked priming__  
##   A visual prime is presented followed by a visual mask at the same position or surrounding the same position
## 
## - __Flanker task__  
##   The Flanker task is a measure of inhibition of prepotent responses. Response times to target stimuli flanked by irrelevant stimuli of the opposite response set (incongruent) are significantly more impaired than when they are flanked by irrelevant stimuli of the same response set (congruent
## 
## - __Mere Exposure Effect__  
##   Participants who are repeatedly exposed to the same stimuli rate them more positively than stimuli that have not been presented before
## 
## - __Cocktail Party Effect__  
##   Participants hear their own name being presented in the irrelevant message during a dichotic listening task
## 
## - __Mental simulation - mismatch advantage: object colour__  
##   Mental simulation (mismatch advantage: object colour)**. Readers verify pictures more quickly when they match rather than mismatch the object colour from the preceding sentence
## 
## - __Mental simulation - match advantage object orientation__  
##   Readers verify pictures more quickly when they match rather than mismatch the object orientation from the preceding sentence
## 
## - __Mental simulation - match advantage object distance__  
##   Readers verify small pictures more quickly when they are far from the protagonist, in contrast to big pictures, while big pictures are verified more quickly when closer to the protagonist, as opposed to smaller pictures
## 
## - __Mental simulation - match advantage object number__  
##   Verification response was faster for concept-object match when there was numerical congruence (compared with incongruence) between the number word and quantity
## 
## - __Mental simulation - match advantage object shape__  
##   Readers verify pictures more quickly when they match rather than mismatch the object shape from the preceding sentence
## 
## - __Mental simulation - match advantage object size__  
##   Readers verify small imagined pictures more quickly when they are small real pictures, in contrast to big real pictures, while big imagined pictures are verified more quickly when they are big real pictures, as opposed to big imagined pictures.​
## 
## - __Mental simulation - bigger is better effect__  
##   Items that are big in real size are processed more quickly than items that are small in real size. ​
## 
## - __Transposed word effect__  
##   Responses to transposed word sequences (e.g. “you that read wrong”) are more error-prone and judged as ungrammatical compared with a control sequence (e.g. “you that read worry”
## 
## - __Personality > intelligence predicting life outcomes__  
##   Personality is generally more predictive than IQ on a variety of important life outcomes, such as educational attainment and wage
## 
## - __Error salience effects__  
##   Error salience **(epistemic contextualism effects). Judgments about “knowledge” are sensitive to the salience of error possibilities. This is explained by the fact that salience shifts the evidential standard required to truthfully say someone “knows” something when those possibilities are made salient.​
## 
## - __Gettier intuition effect__  
##   Participants attributed knowledge in Gettier-type cases (where an individual is justified in believing something to be true but their belief was only correct due to luck) at rates similar to cases of justified true belief
## 
## - __Left-cradling bias__  
##   Left cradling bias** (child cradling lateralization). Humans preferentially hold their child on the left body side. This is hypothesised to be modulated by handedness as the dominant hand is preferably free for mundane tasks
## 
## - __Handedness differences - Schizophrenia__  
##   Handedness differences - schizophrenia**. Non-right-handedness is more prevalent in individuals with schizophrenia compared to the healthy population
## 
## - __Handedness differences - depression__  
##   Being left-handed is associated with a higher likelihood of being depressed
## 
## - __Handedness differences - stuttering__  
##   The rate of stuttering was much higher in left-handers than in right-handers
## 
## - __Handedness differences - dyslexia__  
##   The rate of learning disabilities was much higher in left-handers than in right-handers. ​
## 
## - __Handedness in dyspraxic individuals__  
##   The rate of dyspraxia was much higher in left-handers than in right-handers. ​
## 
## - __Handedness differences - intelligence__  
##   Left-handedness is associated with lower scores in fluid intelligence
## 
## - __Handedness differences - cognitive ability__  
##   Difference in spatial ability between left and right handers. Left handers have a supposed deficit in spatial ability
## 
## - __Handedness differences - sexual orientation__  
##   Intrauterine testosterone levels may determine both handedness and sexuality, with homosexuals having an increased rate of left-handedness
## 
## - __Handedness differences - twins__  
##   Handedness differences between twins and singletons. Twins have been suggested to show increased rates of left handedness compared to singletons.​
## 
## - __Handedness differences - sex__  
##   Handedness differences between men and women. Men have been suggested to show increased rates of left-handedness compared to women
## 
## - __Overlooking of subtractive change__  
##   People systematically default to searching for additive transformations, and consequently overlook subtractive transformations. A tendency to generate and/or select additive ideas over subtractive ones
## 
## - __Heterogeneity reduces perceived quantity__  
##   Sets of multiple colourful or different objects (e.g., stars, squares, triangles) seem less with respect to their quantity than the same sets that consist of only one type of object (e.g., only red triangles
## 
## - __Eye movement and false memories__  
##   Eye movements and false memories. **Lateral eye movements increase false memory rates
## 
## - __Gaze-liking effect__  
##   People are more likely to rate objects as more likeable when they have seen a person repeatedly gaze toward, as opposed to away from the object
## 
## - __Phonological working memory impairment in dyslexic adults__  
##   Dyslexic individuals show lower scores on phonological working memory, using a nonword repetition task. ​
## 
## - __Phonological monitoring impairment in dyslexic adults__  
##   dyslexic show lower scores on phonological monitoring than neurotypical adults. ​
## 
## - __Phonological awareness impairment in dyslexic adults__  
##   Dyslexic show lower scores on phonological awareness than neurotypical adults
## 
## - __Phonemic fluency impairment in dyslexic adults__  
##   Dyslexic adults show lower scores on phonemic fluency tasks than neurotypical adults. Phonemic fluency tasks are a type of verbal fluency task, where people are asked to generate as many words as possible according to a specific criterion relating to phonemes, for instance words starting with the letter ‘M’
## 
## - __Semantic fluency impairment in dyslexic adults__  
##   Dyslexic adults show lower scores on semantic fluency than neurotypical adults. Semantic fluency tasks are a type of verbal fluency task, where people are asked to generate as many words as possible according to a specific criterion, for instance items that are part of the same category, such as foods
## 
## - __Lexical precision on lexical competition__  
##   Lexical precision lexical competition. **The direction and magnitude of inhibitory priming in word targets with dense neighbourhoods is moderated by spelling
## 
## - __Placebo effect__  
##   Placebo Effect. **Refers to the phenomenon in which a treatment or intervention that has no specific therapeutic effect (such as a sugar pill or saline injection) can still produce a therapeutic response in some individuals. The concept of the placebo effect can be traced back to the 18th century, when physicians and researchers began to notice that patients often reported improvements in their symptoms after receiving treatments that did not have any known physiological effects
## 
## - __Placebo empathy analgesia__  
##   Downregulating first-hand pain perception via placebo analgesia (administration of an inert treatment such as a sugar pill)​ also dampens empathy for another person in pain
## 
## - __Nocebo effect__  
##   This phenomenon is said to occur when negative expectations of an individual about an experience (e.g. a medical treatment) cause the experience to have a more negative effect than it would have otherwise
## 
## - __Stroop effect__  
##   Stroop Effect. **A phenomenon in which it takes longer to name the ink colour of a word when the word itself is a colour name that is different from the ink colour (e.g. the word "red" printed in blue ink). The Stroop effect is considered a classic demonstration of the interference between different types of information processing
## 
## - __Disfluency effect__  
##   Disfluency, the subjective experience of difficulty associated with cognitive operations, leads to deeper cognitive processing. If information is processed with difficulty or disfluently (e.g. when written in hard-to-read fonts), this experience serve as a cue that the task is difficult or that one’s intuitive (System 1) response is likely to be wrong, thereby activating more elaborate (System 2) processing, resulting in more positive cognitive outcomes.​
## 
## - __Retrieval-induced forgetting__  
##   RIF). Forgetting of some items is in part a consequence of remembering other items
## 
## - __Mood-dependent retrieval__  
##   mood-dependent memory, state dependent memory, encoding specificity). Memory is enhanced when an individual’s mood (i.e., emotional state) at retrieval matches their mood at encoding
## 
## - __Perky effect__  
##   Mental imagery interferes with perception. If persons were asked to describe their images of common objects while dim facsimiles of the objects were presented before them, they reported only an "imagery," not a "perceptual," experience; imagery and stimuli are indistinguishable.​
## 
## - __Positive emotions broaden scope of attention__  
##   People experiencing positive emotions exhibit broader scopes of attention than do people experiencing no particular emotion
## 
## - __Emotional information facilitates response inhibition__  
##   Response inhibition refers to suppression of prepotent responses which are inappropriate to current task demands. In the lab setting, this is investigated with a stop signal task. The effect showed that both fearful and happy faces as stop signals facilitated response inhibition relative to neutral ones
## 
## - __Inhibition-induced devaluation__  
##   Inhibition induced devaluation.** Inhibition-induced devaluation refers to reduced response to stimuli which were previously inhibited. This effect results in participants bidding less for shapes that were paired with stop-signals, giving less trustworthiness rating for faces previously paired with stop signals. This effect has several implications for behaviour modification techniques
## 
## - __Inhibition induced forgetting__  
##   Inhibition-induced forgetting refers to impaired memory for the stimuli to which responses were inhibited
## 
## - __Semantic Richness in Lexical Processing: the Body-object Interaction Effect__  
##   Words that have higher ratings on the BOI measure receive faster responses (RTs) in lexical-semantic tasks (e.g., lexical decision, semantic decision). The BOI quantifies the ease with which the human body can physically interact with a word’s referent. The BOI effect is thought to show that sensorimotor information contributes to word meaning, providing support for embodied theories of semantic representation
## 
## - __False memory implantation__  
##   false memory fabrication). **People fabricate false memories after the suggestion that it happened. After discussing their memories with a researcher, participants reported a false memory
## 
## - __Serial dependence__  
##   Serial dependence describes a visual bias that a reported item (e.g., orientation) is systematically attracted towards the previous reported item
## 
## - __Modality-switching cost__  
##   modality switch effect). When verifying object properties, processing is slowed when the modality being processed is different from the modality processed in the preceding trial. The presence of the switching cost suggests that people represent semantic information in a modality-specific, rather than amodal or abstract, manner.​
## 
## - __Tactile Disadvantage__  
##   conceptual tactile disadvantage). Participants find it more difficult and are slower to process words strongly related to the tactile modality (e.g., _sticky_), compared to processing words from other modalities (visual, auditory etc.). The presence of this conceptual tactile disadvantage mirrors a similar disadvantage observed in perceptual processing, where tactile stimuli are slower and more difficult to process than visual or auditory stimuli.​
## 
## - __Perceptual strength in lexical processing__  
##   visual lexical decision task). Concepts that are rated as being more strongly linked to perceptual experience are processed more quickly than those more weakly linked to perceptual experience. This pattern suggests a sensory basis for conceptual representations.​
## 
## - __Semantic richness in lexical processing__  
##   visual lexical decision task). Concepts that are associated with a larger amount of semantic information (e.g., larger number of features, greater semantic neighbourhood density) are processed more quickly in tasks that require semantic processing. This pattern suggests that richer semantic representations (i.e., more semantic information) facilitate semantic processing
## 
## - __Temporal doppler effect__  
##   Subjective perception that the past is further away than the future
## 
## - __Contextual cueing__  
##   Compared to novel contexts (i.e., spatial arrangements), repeated contexts yield faster response times in visual search without consciously recognizing the context as repeated
## 
## - __Search initiation effect__  
##   In a repeated search task, the very first search takes substantially longer than all subsequent searches, implying that most information is processed and learned during the first search which can then be used to guide subsequent searches efficiently.​
## 
## - __Attentional blink__  
##   The attentional blink describes the phenomenon that in a rapid serial visual presentation ​of items, humans show a reduced ability to detect the second of two targets among distractors if the second target follows after approximately 200ms – 500ms after the first target. This effect is interpreted as displaying one of the limitations of human visual processing
## 
## - __Emotional attentional blink__  
##   emotion-induced blindness). Similar to the attentional blink, a target among distractors in a rapid serial visual presentation of images is missed, if it was preceded by an emotionally arousing image. Importantly and in contrast to the attentional blink phenomenon, the emotionally ​arousing image is task-irrelevant
## 
## 
## **Comparative Psychology**
## 
## - __Gaze following in monkeys__  
##   Monkeys fail to follow the gaze of another agent, using the object choice task. ​
## 
## - __Pointing following in monkeys__  
##   Monkeys fail to follow the point of another agent, using the object choice task. ​
## 
## - __Gaze following in nonhuman primates__  
##   Nonhuman primates fail to follow the gaze of another agent, using the object choice task. ​
## 
## - __Pointing following in nonhuman primates__  
##   Nonhuman primates fail to follow the point of another agent, using the object choice task. ​
## 
## - __Gaze following in domesticated dogs__  
##   Dogs follow the gaze of another agent, using the object choice task. ​
## 
## - __Pointing following in domesticated dogs__  
##   Dogs follow the point of another agent, using the object choice task. ​
## 
## - __Pointing following in coyotes__  
##   Coyotes do not follow the pointing of a human agent, using the object choice task
## 
## - __Gaze following in wolves__  
##   Wolves do not follow the gaze of a human agent, using the object choice task
## 
## - __Pointing following in wolves__  
##   wolves do not follow the pointing of a human agent, using the object choice task
## 
## - __Pointing following in Asian elephants__  
##   Asian elephants do not follow the pointing of a human agent, using the object choice task
## 
## - __Pointing following in African elephants__  
##   African elephants follow the pointing of a human agent, using the object choice task
## 
## - __Gaze following in horses__  
##   Horses do not follow the gaze of a human agent, using the object choice task
## 
## - __Pointing following in horses__  
##   Horses follow the pointing of a human agent, using the object choice task
## 
## - __Gaze following in domesticated pigs__  
##   Domesticated pigs do not follow the gaze of a human agent, using the object choice task
## 
## - __Pointing following in domesticated pigs__  
##   Pointing following in pigs**. Domesticated pigs do not follow the pointing of a human agent, using the object choice task
## 
## - __Pointing following in goats__  
##   Goats follow the pointing of a human agent, using the object choice task
## 
## - __Gaze following in goats__  
##   Goats do not follow the gaze of a human agent, using the object choice task
## 
## - __Eye narrowing in felines__  
##   Felines are more likely to narrow their eyes following a slow blink from humans
## 
## - __Pointing following in felines__  
##   Felines do not follow the pointing of another agent, using the object choice task. ​
## 
## - __Mirror self-recognition in magpies__  
##   Mirror-self recognition in magpies (Pica pica)**. Magpies have been suggested to be able to recognize themselves in the mirror implying a self-representation akin to chimpanzees​
## 
## - __Right-bias in hand use in chimpanzees__  
##   population handedness asymmetry). Chimpanzees have been proposed to be right-handed on the population level similar to humans
## 
## - __Cache protection in Eurasian jays__  
##   Garrulus glandarius_)**. Eurasian jays may opt to cache in out-of-view locations to reduce the likelihood of conspecifics pilfering their caches
## 
## - __Desire-state attribution may govern food sharing in Eurasian jays (_Garrulus glandarius_)__  
##   Male Eurasian jays may share food with their female partners in-line with the females current desire
## 
## - __Reasoning about hidden causal agents in New Caledonian Crows (_Corvus moneduloides_)__  
##   Reasoning about hidden causal agents in New Caledonian Crows (Corvus moneduloides)**. New Caledonian Crows “showed greater vigilance towards an area from which they had previously witnessed a threatening “stick attack” if a hidden causal agent (a human) could still be present in that area compared to when a human person had visibly left.”
## 
## - __Owners predict spatial impulsivity in dogs__  
##   spatial discounting, spatial discount, distance discounting). This phenomenon explores whether owner ratings of impulsivity in their dogs correlate with behavioural measures of the distance their dogs travel in a spatial impulsivity task. The original study (Brady et al., 2018) found that owner ratings of adult dog impulsivity (using the Dog Impulsivity Assessment Scale; Wright et al., 2011) matched levels of impulsivity in a spatial impulsivity task (but not for young dogs). Two subsequent studies using similar methods did not replicate this correlation, and an overall meta-analysis did not find evidence for an effect.​
## 
## - __Numerical ratio effects on quantity discrimination in elephants__  
##   Number discrimination, quantity/number judgments). The numerical ratio between quantities has been shown to predict the ability to discriminate quantities across a wide range of species. However, Irie-Sugimoto et al., (2009) found that elephants did not follow this pattern because numerical ratio did not predict performance. Perdue et al. (2012) replicated the study in elephants with a similar design and found that ratio predicted performance, reversing the findings of the original study.​
## 
## - __Contagious yawning in dogs__  
##   Dogs have been shown to yawn more after observing a person yawn than after a control condition with other mouth movements. The original study (Joly-Mascheroni et al., 2008) found 72% of dogs yawned after watching a human yawn but none yawned after watching other mouth movements. Two subsequent studies did not replicate a difference in yawning between conditions (Harr et al., 2009; O’Hara and Reeve, 2010), but a third did find a difference (Madsen and Persson, 2012
## 
## - __Temporal preferences in chimpanzees and bonobos__  
##   temporal/time discounting, intertemporal choice, delay choice). Chimpanzees (_Pan troglodytes_) wait longer than bonobos (_Pan paniscus_) in intertemporal choice tasks providing choices between smaller, sooner and larger, later food rewards. Rosati et al. (2007) found chimpanzees waited longer than bonobos at the Leipzig Zoo. Rosati and Hare (2013) confirmed this finding in a group of chimpanzees and bonobos at Tchimpounga Chimpanzee Sanctuary in Republic of Congo
## 
## - __Risk preferences in chimpanzees and bonobos__  
##   risky choice). Chimpanzees (_Pan troglodytes_) choose risky options more than bonobos (_Pan paniscus_) in risky choice tasks providing choices between guaranteed and risky food rewards. Heilbronner et al. (2008) found chimpanzees preferred risky options more than bonobos at the Leipzig Zoo. Rosati and Hare (2013) confirmed this finding in a group of chimpanzees and bonobos at Tchimpounga Chimpanzee Sanctuary in Republic of Congo
## 
## 
## **Developmental Psychology**
## 
## - __Growth mindset__  
##   Thinking that skill is improvable on attainment
## 
## - __Expertise attained after 10,000 hours practice__  
##   The notion that it takes around 10,000 hours of practice to become an expert in a particular field or domain. Specifically, that deliberate practice explains from most to all of the variance in (expert) performance in sports
## 
## - __Tailoring to learning styles__  
##   Tailoring teaching to students’ preferred learning styles has any effect on objective measures of attainment
## 
## - __Neonate imitation__  
##   Babies are born with the ability to imitate
## 
## - __Violent media content on aggression__  
##   Violence content in media can affect people to be more aggressive. Notably, the studies of this effect differ by media (TV, games, etc.) and whether long, medium, or short-term effects have been investigated. The variety of methods/tests further complicates the literature. Distinct media types are marked for each reference below
## 
## - __Mutual exclusivity bias__  
##   When presented with two objects, one of which has a known label and one which does not, infants (by ~20mo) are more likely to choose the object without a known label when prompted with a novel label
## 
## - __Mutual exclusivity bias - bilinguals__  
##   Mutual exclusivity bias in bilinguals**. Bilingual (and multilingual) infants exhibit delayed and/or lower mutual exclusivity bias than monolingual infants
## 
## - __Abstract rule learning__  
##   After training on strings on stimuli generated from a particular repetition pattern (e.g., AAB), young infants attend longer to novel stimuli generated from a novel pattern (e.g., ABA) than novel stimuli generated from the original pattern
## 
## - __Theory of mind – below-4 year olds__  
##   Theory of mind in below-4 year olds **(false belief). Children under four years of age fail at theory of mind tasks
## 
## - __Theory of mind – over development__  
##   Theory of mind over development** (false belief). Success rate at theory of mind tasks increases over age within the first 6 years of life
## 
## - __Preference for prosocial agents__  
##   Infants and toddlers prefer prosocial agents over neutral or antisocial agents
## 
## - __Flynn effect__  
##   The observed rise over time in standardised intelligence test scores in the successive versions of Stanford-Binet and Wechsler intelligence tests. This effect points toward an increase in “intelligence” in the next generation compared to the previous generation
## 
## - __Do children overhear to learn new words?__  
##   Children were equally good at learning novel words- when they were overhearers as when they were directly addressed
## 
## 
## **Differential Psychology**
## 
## - __2D:4D ratio of the fingers__  
##   and its correlation with psychological traits. **This ratio was used as a predictor for different interindividual (e.g., intelligence) and especially gender differences
## 
## - __Personality traits and consequential life outcomes__  
##   Personality traits (i.e., characteristic patterns of thinking, feeling, or behaving that tends to be consistent over time and across relevant situations), particularly the Big Five factors, are linked with consequential individual, interpersonal, and social-institutional outcomes
## 
## - __Reading prevents cancer__  
##   Combining bibliotherapy and short-term individual therapy can reduce the probability of dying from cancer and may prolong lives of those already suffering from cancer.​
## 
## - __Graphology__  
##   The analysis of handwriting with the attempt to determine someone’s personality traits
## 
## 
## **Educational Psychology**
## 
## - __Flipped learning__  
##   students learn better if they do homework about a lesson before coming to class to study that lesson
## 
## - __Mindsets__  
##   People’s beliefs about whether their talents and abilities are subject to growth and improvement. In recent years, mindset proponents have argued that interventions work but only for low SES populations or low-performing students
## 
## - __First instinct fallacy__  
##   the false belief that one’s initial thoughts/ideas/answers are right and closer to the truth than revised thoughts/ideas/answers. Surveys have shown that students generally believe that changing answers on a multiple-choice test lowers test scores, but research seems to show that most people who change their answers usually improve their test scores
## 
## - __Mirror reading and writing in dyslexia__  
##   Strephosymbolia). Strephosymbolia is a term coined to describe a learning disorder in which symbols and especially phrases, words, or letters appear to be reversed or transposed in reading. The incidence of strephosymbolia seems to be widely documented.​
## 
## - __Pen mightier than the screen__  
##   Learning for conceptual-application questions is more effective when taking longhand notes than with a laptop
## 
## - __Sleep-assisted learning__  
##   hypnopedia). Memorising new information while sleeping
## 
## - __Dr. Fox effect__  
##   Dr. Fox Effect. **Students rate educators higher based on qualities beyond the educational content itself (e.g., charisma, enthusiasm, entertainment
## 
## - __Cooperative learning__  
##   peer learning, collaborative learning). The idea that learners that work together in cooperative groups under positive interdependence reach better learning outcomes compared to students working individually (no interdependence) or competitively (negative interdependence).​
## 
## - __Self-affirmation (value affirmation)__  
##   Self-affirmation** (value affirmation). Affirming a sense of self-integrity, a global image of moral and adaptive adequacy, can buffer psychological threat, such as the minority achievement gap
## 
## - __Utility-value intervention (Relevance intervention)__  
##   Utility-value intervention **(Relevance intervention)**. **Encouraging students to make connections between their lives and what they were learning in their science courses increase grades
## 
## - __Belonging intervention__  
##   Buttressing college freshmen’s sense of social belonging in school can improve their achievement and bridging achievement gap between African-American students and European-American students
## 
## - __A Person × Nation interaction effect of interest and achievement__  
##   The association between science interest and science knowledge depended on economic resources, such that in more economically prosperous families, schools, and nations, student interest was more strongly correlated with actual knowledge
## 
## 
## **Evolutionary Linguistics**
## 
## - __Typological Prevalence Hypothesis: Learnability of semantics (evidentiality)__  
##   Typological Prevalence Hypothesis.** The typological prevalence hypothesis is a proposal that suggests that certain structural features are more common across languages than others due to factors such as ease of learning, processing, and use. These more prevalent structural features are thought to be more likely to be retained in a language over time. Claims that cross-linguistically more prevalent distinctions are easier to learn, or the more common a certain distinction or way of categorising across languages, the more cognitively natural (and easily learnable) for humans it should be. This effect is explored for the grammatical structure of evidentiality, or grammatical marking of information source in an utterance
## 
## 
## **Evolutionary Psychology**
## 
## - __Fertility facial-preferences effect__  
##   Women prefer more masculine rather than feminised faces of potential partners during the fertile phase of their menstrual cycle. The preference for secondary sexual traits in male face shapes varies with the probability of conception
## 
## - __Dunbar’s number__  
##   The number of neocortical neurons limits the organism's information-processing capacity and this then limits the number of relationships that an individual can monitor simultaneously. Humans are cognitively or emotionally limited to 150 relationships with other people
## 
## - __Romantic priming__  
##   Looking at attractive women increases men’s conspicuous consumption, time discount and risk-taking
## 
## - __Implicit analytic priming__  
##   Implicitly priming analytic thinking by seeing a photo of Auguste Rodin's The Thinker decreases belief in God
## 
## - __Menstrual cycle version of the dual-mating-strategy__  
##   Hypothesis that “heterosexual women show stronger preferences for uncommitted sexual relationships [with more masculine men] during the high-fertility ovulatory phase of the menstrual cycle, while preferring long-term relationships at other points”
## 
## - __Menstrual cycle and lunar influence__  
##   Women with a 29.5+/-1 day menstrual cycle tend to menstruate during a full moon
## 
## - __Large parents have more sons__  
##   Bigger and taller parents have more sons
## 
## - __Men’s strength predicts opposition to egalitarianism__  
##   Men’s strength in particular predicts opposition to egalitarianism**. Muscular men are less likely to support social and economic equality
## 
## - __Sex differences in mate preferences__  
##   Men and women differ in preferences of a potential mate which reflects different evolutionary selection pressures. Across 33 countries (original study; 45 - replication) researchers found universal sex differences such as: men, more than women, prefer attractive, young mates, and women, more than men, prefer older mates with financial prospects
## 
## - __Men's preference for competition__  
##   Men’s preference for competition**. Men are more likely to select tournaments than women, because women tend to avoid competition and men look for competition
## 
## - __Orgasm gap__  
##   Orgasm equality). There is a gendered orgasm gap, with men experiencing orgasm more frequently than women in heterosexual sexual encounters.​
## 
## - __Precarious manhood__  
##   Manhood, in contrast to womanhood, is seen as a precarious state requiring continual social proof and validation.​ Compared with womanhood, which is typically viewed as resulting from a natural, permanent, and biological developmental transition, manhood must be earned and maintained through publicly verifiable actions; because of this, men experience more anxiety over their gender status than women do, particularly when gender status is uncertain or challenged
## 
## - __Trivers–Willard hypothesis__  
##   The Trivers–Willard hypothesis predicts that parents in good condition will be biassed towards investing more in their sons, while parents in poor condition will invest more in their daughters; this investment involves both post-birth investment and manipulation of the sex ratio. As female reproductive success is less variable than male one, daughters are a safer bet for providing at least some progeny, but very successful sons can have many more children than daughters
## 
## - __Birth order effect on sexuality - fraternal birth order__  
##   Fraternal birth order effect on male homosexuality **(older brother effect). Male homosexuals are more likely than male heterosexuals to have one or more older brothers. Biologically, that is thought to be due to the immunisation of the mother against Y-linked proteins during previous pregnancies with male foetuses, which decreases the activity of those proteins responsible for heterosexual male sexual orientation in subsequently-born sons
## 
## - __Birth order effect on sexuality - sororal birth order__  
##   Sororal birth order effect on male homosexuality **(older sister effect). Male homosexuals are more likely than male heterosexuals to have one or more older sisters. The mechanism is proposed to be similar to the older brother effect, with alive older sisters serving as proxy for attempted pregnancies, some of which probably ended in miscarriages. If the miscarried foetus was male, it would immunise the mother against its Y-linked proteins in a manner similar to an alive older brother
## 
## - __Facial hair effect – attractiveness__  
##   Beards make men look more attractive
## 
## - __Facial hair effect – masculinity__  
##   Bearded men are perceived as more masculine.​
## 
## - __Facial hair effect – dominance__  
##   Bearded men are perceived as more dominant
## 
## - __Facial hair effect – aggressiveness__  
##   Bearded men are perceived as more aggressive
## 
## 
## **Experimental Philosophy**
## 
## - __Fake barn cases__  
##   “Older participants are less likely than younger participants to attribute knowledge in fake-barn cases”
## 
## - __Stakes effect__  
##   alternative terms = a subset of interest-relative invariantism, interest-relativity of knowledge, bank cases). Knowledge is sensitive to stakes. According to the [Stanford Encyclopedia of Philosophy](https://plato.stanford.edu/ENTRIES/experimental-philosophy/#Epis), "a number of early findings from the experimental epistemology literature suggested that people's ordinary knowledge attributions actually don't depend on stakes
## 
## 
## **Health Psychology**
## 
## - __Stress as the main/sole cause of peptide ulcers__  
##   Stress as the main/sole cause of peptic ulcers**. Stress was the main cause of peptic ulcers (with secondary contributing factors thought to be excess stomach acid, spicy food
## 
## - __Graphic images and cigarette use__  
##   Graphic warning labels). Introducing graphic warning labels (GWL) on cigarette packages reduces smoking prevalence.​
## 
## - __Social isolation – all-cause mortality__  
##   Social isolation, i.e. an objective lack of (or limited) social contact with other people, is related with higher risk of mortality from all causes
## 
## - __Social isolation – cardiovascular disease mortality__  
##   Social isolation, i.e. an objective lack of (or limited) social contact with other people is related with higher risk of mortality from cardiovascular diseases.​
## 
## - __Social isolation – cancer mortality__  
##   Social isolation, i.e. an objective lack of (or limited) social contact with other people is related with higher risk of mortality from cancer.​
## 
## - __Loneliness – all-cause mortality__  
##   Loneliness, as a subjective feeling of distress, is related to higher risk of mortality from all causes
## 
## - __Loneliness – cardiovascular disease mortality__  
##   Loneliness, as a subjective feeling of distress, is related to higher risk of mortality from cardiovascular diseases
## 
## - __Loneliness – cancer mortality__  
##   Loneliness, as a subjective feeling of distress, is related to higher risk of mortality from cancer.​
## 
## - __Self-inflicted pain out of boredom__  
##   Boredom is an important impetus for self-injury. Participants could administer electric shocks in a boring, sad or neutral condition
## 
## 
## **Judgement and Decision Making/Behavioural Economics**
## 
## - __Default effect__  
##   In a choice scenario between two alternatives, when an alternative is presented as a default option, people stick with it rather than change it. For example, 'Opt Out' default organ donation policies increase organ donations
## 
## - __Decoy effect__  
##   alternatives: asymmetric dominance; attraction effect). The Decoy Effect is a cognitive bias in which an individual's preference between two options is influenced by the presence of a third, asymmetrically dominated option (i.e., a decoy similar but inferior to one of the original options). Individuals are more likely to choose the option that is similar to the decoy option than if the decoy were absent. Decoy effect has been replicated in different studies and contexts, though the magnitude of the effect can vary, particularly depending on the specific features of the options being considered and the context in which the decisions are being made
## 
## - __Nudges__  
##   Choice architecture interventions that promote beneficial decisions
## 
## - __Risky choice framing effect__  
##   term used by Levin et al., 1998) (framing effect in risky-decision making). Under loss-frame, people are risk-seeking, whereas under gain-frame, people are risk-averse. In framing studies, logically equivalent choice situations are differently described and the resulting preferences are studied. In risky choice problems, the way a choice is presented influences the decision (e.g. saving 10 people out of 100 vs losing 90 people out of 100
## 
## - __Risk and goal message framing__  
##   a) For illness detection behaviours, loss framing (presenting information of negative consequences with undesirable behaviours / without desirable behaviours) would be more effective than gain framing (presenting information of benefits through engaging in desirable behaviours) in encouraging healthy attitudes, intentions, and behaviours (perhaps because illness detection behaviours are riskier, Rothman and Salovey, 1997), whereas b) for health-affirming behaviours, gain framing would be more effective than loss framing in motivating healthy attitudes, intentions, behaviours (perhaps because health-affirming behaviours are less risky, Rothman and Salovey, 1997
## 
## - __Status quo effect__  
##   status quo bias). A cognitive bias that leads people to prefer things to stay the same, even when change may be beneficial, thus a preference for the current state of affairs
## 
## - __Temporal action-inaction effect__  
##   The proposed phenomenon that people associate or experience stronger regret with action compared to inaction in the short-term, but stronger regret with inaction compared to action in the long-term. ​
## 
## - __Money market versus goods/social market__  
##   The money market relationship refers to an exchange in which effort level is determined based on the level of compensation. By contrast, the social market relationship is an exchange in which effort level is most influenced by altruistic motivations rather than the compensation level. Heyman and Ariely (2004) proposed and showed that when the former is primed with monetary compensation, the more compensation they receive, the more effort they displayed. Yet, effort level did not vary depending on the level of compensation when the latter is primed with non-monetary compensation (i.e., goods), effort level does not depend on compensation level. ​
## 
## - __Risk benefits negative association__  
##   Risk and benefit perceptions **(affect heuristic). Increasing risks of a hazard leads people to judge its benefits as lower while vice versa increasing benefits leads people to judge its risk as lower.​
## 
## - __Temporal value asymmetry__  
##   TVA). The phenomenon that contemplating future events elicits stronger emotions than contemplating past events has been coined “temporal value asymmetry” (TVA). TVA was robust in between-persons comparisons and absent in within-persons comparisons
## 
## - __Exceptionality effect__  
##   emotional amplification, normality bias, exceptional-routine effect). The affective response to an event is enhanced if its causes are abnormal. Exceptionality effect is the phenomenon that people associate stronger negative affect with a negative outcome when it is a result of an exception (abnormal behaviour) compared to when it is a result of routine (normal behaviour). The exceptionality enhances the response to an event for the emotion of regret, self-blame, the cognitive response for victim compensation and offender punishment
## 
## - __Temporal differences in trait self-ascriptions__  
##   Much like how we are more likely to ascribe dispositional traits, as opposed to situational variables, when explaining the behaviour of other people compared to ourselves, the same asymmetry can also be observed when making trait assessments about our temporally distant selves (e.g. past or future). People are more likely to ascribe dispositional traits, compared to situational explanations, when making judgements about their past or future self
## 
## - __Bias Blind Spot__  
##   The phenomenon that people perceive stronger biases for others compared to self. Pronin (2002) found support for self-other asymmetries in perceived biases but failed to find support for self-other asymmetries in perceived personal shortcomings. Chandrashekar et al. (2021) found support for self-other asymmetries for both biases and personal shortcomings.​
## 
## - __Hindsight Bias__  
##   Hindsight bias refers to the tendency to perceive an event outcome as more probable after being informed of that outcome
## 
## - __Disjunction Effect__  
##   The sure-thing principle (STP) posits that if decision-makers are willing to make the same decision regardless of whether an external event happens or not, then decision-makers should also be willing to make the same decision when the outcome of the event is uncertain. People regularly violate the STP – uncertainty about an outcome influence decisions.​
## 
## - __Money Illusion__  
##   The inability of individuals to account for inflation or deflation when making decisions. If inflation, money loses value over time, leading to people to fail to consider the impact of inflation or real value of money
## 
## - __Choosing versus rejecting__  
##   Framing effects, compatibility principle). People are inconsistent in their preferences when faced with choosing versus rejecting decision-making scenarios
## 
## - __Conjunction bias__  
##   conjunction fallacy). The fallacy consists of judging the conjunction of two events as more likely than any of the two specific events, violating one of the most fundamental tenets of probability theory
## 
## - __Direct versus indirect harm__  
##   Individuals believe that causing indirect harm is more moral than direct harm, regardless of outcomes, intentions, or self-presentational concern
## 
## - __Distinction bias__  
##   When evaluating how happy options would make them, people who evaluated the options simultaneously predicted greater happiness for the good options and lower happiness for the bad options, whereas people who evaluated the options separately (i.e., only evaluated one option) showed little difference between the options
## 
## - __Inaction inertia effect__  
##   Forgoing an offer that is less appealing, but still desirable, than a previous offer. For example, if you missed the opportunity to attend a skiing trip that was offered at £40 rather than the usual £100​, you would reject the offer of going to the same ski trip when offered for £80 rather than the usual £100
## 
## - __Mere ownership effect__  
##   The mere ownership effect refers to an individual's tendency to evaluate an object more favourably merely because he or she owns it
## 
## - __Omission Bias__  
##   alternative terms: action-inaction effect). The tendency to view harmful actions as worse than inactions, despite the result being the same
## 
## - __Identifiable victim effect__  
##   Refers to the phenomenon that people are more likely to offer greater help to specific, identifiable victims than to anonymous victims
## 
## - __Psychophysical numbing__  
##   People prefer to save lives if they are a higher proportion of the total (e.g. do people prefer to save 4,500 lives out of 11,000 or 4,500 lives out of 250,000
## 
## - __Loss aversion__  
##   The subjective value of losses exceeds the subjective values of gains. This phenomenon can denote a stronger preference for avoiding losses rather than acquiring gains. Loss aversion is still mostly replicable but with weaker effects for some people and in some situations (see [Mrkva et al., 2020](https://www.alexandria.unisg.ch/260559/2/jcpy.1156.pdf
## 
## - __Effort heuristic__  
##   People judge products that took longer time to complete as higher in quality and monetary value
## 
## - __Unconscious thought advantage__  
##   “deliberation-without-attention”). The idea that for complex choices (with more features to take into account), not deliberating leads to better decisions (as defined by the research team, i.e., normatively).​
## 
## - __Self-interest is overestimated__  
##   How much personal benefits affect policy preferences and behaviours
## 
## - __Marshmallow experiment__  
##   self-imposed delay of gratification). A child’s success in delaying the gratification of eating marshmallows or a similar treat is related to better outcomes in later life. ​Outcomes that have been studied include coping, social, and academic competence, substance use, borderline personality features, BMI, executive functioning, and neural activation patterns
## 
## - __Differential reinforcement of alternate behaviour (DRA)__  
##   DRA procedures reduce a certain behaviour by reinforcing an appropriate alternative behaviour that serves the same function
## 
## - __Differential reinforcement of incompatible behaviour (DRI)__  
##   DRI** **reinforces a physically incompatible behaviour to replace the unwanted behaviour
## 
## - __Differential reinforcement of low rates of behaviour (DRL)__  
##   DRL is a technique in which a positive reinforcer is delivered at the end of a specific interval if a target behaviour has occurred at a criterion rate
## 
## - __Differential reinforcement of other behaviour (DRO)__  
##   is a reinforcement procedure in which reinforcement is delivered for any response other than a specific target behaviour
## 
## - __Extinction bursts__  
##   Extinction is an intervention procedure to reduce tantrum behaviours, by removing enforcement (eg. ignoring a child crying), and an extinction burst is a temporary increase in the frequency or intensity of that behavior
## 
## - __Functional communication training__  
##   FCT) is a therapy for autistic children, or children with severe behaviour problems. FCT aims to replace challenging behaviour with new methods of communication
## 
## - __Schedules of R+__  
##   Rule that describes how often the occurrence of a behaviour will receive a reinforcement. Used as part of ABA (Applied Behaviour Analysis) in autistic individuals
## 
## - __Above-Average Effect__  
##   Better-Than-Average Effect). People have the tendency to perceive themselves as superior in comparison to the average peer
## 
## - __Below-Average Effect__  
##   The tendency of a person to underestimate their intellectual or social abilities when comparing to other people
## 
## - __Overconfidence__  
##   “unskilled and unaware of it” effect, overplacement, overprecision, calibration of subjective probabilities, realism of confidence). It is the overestimation of one’s actual ability, performance, level of control, or chance of success in any given situation
## 
## - __Better-than-average effect__  
##   People tend to rate themselves as better than average on desirable traits and skills.​
## 
## - __Accuracy of information__  
##   truth discernment)**. **Asking people to think about the accuracy of a single headline improves “truth discernment” of intentions to share news headlines about COVID-19.​
## 
## - __Resultant moral luck__  
##   The phenomenon of moral judgments being influenced by factors beyond the agent’s control that affect the outcome of their actions. Kneer and Machery (2019) claim that there is no evidence for resultant moral luck and that the puzzle of moral luck is not a genuine problem.​
## 
## - __Incidental disgust__  
##   Amplification hypothesis). Irrelevant feelings of disgust can amplify the severity of moral condemnation
## 
## - __Single exposure musical conditioning__  
##   Single-exposure musical conditioning**. An important study, which employed classical conditioning theory, proposed that a person's preference for a product can be influenced by the type of music they hear while being exposed to it. A follow-up experiment differentiated between scenarios to see whether classical conditioning or information processing might be a better explanation for product preference
## 
## - __Rational expectations__  
##   Rational Expectations. **The extent to which participants in an experiment choose the action with the highest expected payoff based on their private signal and the choices and outcomes of previous participants
## 
## - __Decreased sense of free will reduces personal responsibility__  
##   Vohs and Schooler (2008) asked participants to read an article either debunking free will or a control passage, and found that those reading the former cheated more on an experimental task. It was suggested that the decreased sense of free will as a result of reading the text reduced perceptions of personal responsibility
## 
## - __Unrealistic optimism__  
##   Optimism bias). The tendency to overestimate the likelihood of experiencing positive outcomes and underestimating negative ones.​
## 
## - __Miles per gallon illusion__  
##   MPG illusion, kilometres per litres illusion)**. **People misperceive how much fuel and money will be saved by, because they assume fuel use increases linearly with MPG, whereas in reality, increasing by a few MPG saves much more gas at low levels of MPG (e.g., 12 to 14 MPG) compared to high levels (e.g., 30 to 32 MPG
## 
## - __Certainty effect__  
##   The tendency to overweight the importance of an increase from 99% to 100% probability that some prospect/event will occur
## 
## - __Overweighting small probabilities__  
##   People tend to overweight/overreact to changes in probability from 0 to very small probabilities. (In other words, whereas classical economic theory would suggest changing from 0% to 1% chance should have the same impact as a change from a 20% to 21% chance, people respond much more strongly to the former change
## 
## - __Positive affect increases patience__  
##   Watching a positive affect-inducing video will increase patience in an intertemporal choice task
## 
## - __Slow to anger, fast to forgive__  
##   Adding noise/uncertainty to the reason for a person’s action leads people to be more lenient (slow to anger, quick to forgive). A secondary finding is that under these circumstances with noise/uncertainty, cooperative strategies also lead to higher payoffs (in situations with cooperative equilibria
## 
## - __Isolation effect__  
##   Von Restorff effect). The isolation effect occurs when people focus on differences between options rather than similarities. We not only remember the differences between two stimuli, but we also tend to give it greater weighting. For example, we notice the one single yellow that stands out in a batch of red apples
## 
## - __Magnitude effect__  
##   magnitude perception). People are sensitive to relative as well as absolute magnitude. Most people find the difference between $100 and $200 more meaningful than the difference between $1,100 and $1,200; the marginal value of the outcome generally scales with magnitude.​
## 
## - __Reflection effect__  
##   People tend to be risk seeking when maximising gains, but risk averse when minimising losses.​ The preference between negative prospects is the mirror image of the preference between positive prospects – the reflection of prospects around 0 reveres the preference order
## 
## - __Unusual disease problem__  
##   Asian disease problem). When survival is communicated (positive framing), people tend to choose an option with a certain outcome (risk averse decision). In contrast, when mortality is communicated (negative framing), people tend to choose an option with an uncertain outcome (risk-seeking decision).​
## 
## - __Last-place aversion__  
##   Last place aversion.** A phenomenon where individuals are averse to being in last place and choose gambles with the potential to move them out of last place that they reject when randomly placed in other parts of the distribution
## 
## - __Ikea effect__  
##   When compared to objectively similar goods not produced by themselves, consumers place a higher value on goods they have assembled. Consumers show a higher willingness-to-pay when they assemble products themselves
## 
## - __Endowment effect__  
##   People are more likely to retain an object they own than acquire that same object when they do not own it. This implies that the value that an individual assigns to objects appears to increase substantially as soon as that individual is given the object
## 
## - __Weaker sunk costs effect for time (vs. money)__  
##   Sunk costs effect for time (vs. money)**. Sunk costs are where an individual’s decision making is affected by having previously committed resources that cannot be recovered (e.g., time, money, effort) to a particular choice, which then results in them being less inclined to change to an alternative choice. It has been observed that there are greater sunk costs associated with previously allocated money over previously allocated time
## 
## 
## **Marketing**
## 
## - __Choice overload__  
##   The idea that giving people too many choices can lead to certain undesirable consequences such as reduced purchasing intentions
## 
## - __Mate guarding__  
##   Women use conspicuous luxurious goods to deter female rivals by signalling to other women they have a devoted partner
## 
## - __Scarcity effect - Overborrowing__  
##   Scarcity effect - _Overborrowing_. **Perceived financial scarcity causes consumers to overborrow
## 
## - __Scarcity effect - Resource allocation__  
##   Scarcity effect - _Resource allocation_. **Poor economic conditions favour resource allocations to daughters over sons
## 
## - __Scarcity effect - Planning__  
##   Scarcity effect - _Planning_.** Consumers who feel resource constrained shift to engage in relatively more priority planning, rather than efficiency planning
## 
## - __Scarcity effect - Competition/threat__  
##   Scarcity effect - _Competition/threat_.** Exposure to limited-quantity promotion advertising prompts consumers to perceive other shoppers as competitive threats
## 
## - __Scarcity effect - Brand attitudes__  
##   Scarcity effect - _Brand attitudes_**. Observing luxury brand consumers whose consumption arises from unearned financial resources reduces observers’ brand attitudes when observers place a high value on fairness.​
## 
## - __Scarcity effect - Product use creativity__  
##   Scarcity effect - _Product use creativity_**. Scarcity salience is associated with greater creativity.​
## 
## - __Scarcity effect - Wage rates__  
##   Scarcity effect - _Wage rates_**. The difference in implied wage rates based on a time elicitation versus a money elicitation procedure is reduced as the time horizon increases.​
## 
## - __Scarcity effect - Selfishness__  
##   Scarcity effect - _Selfishness_. ** Reminders of scarcity causes selfish behaviour to a greater extent in people with low social value orientation.​
## 
## - __Scarcity effect - Preference for material goods__  
##   Scarcity effect - _Preference for material goods_.** Scarcity leads to a preference for material goods over experiential goods.​
## 
## - __Scarcity effect - Preference polarisation__  
##   Scarcity effect - _Preference polarisation_**. Perceived scarcity leads to greater preference polarisation and stronger preference for a preferred option over a less preferred option.​
## 
## - __Product size and status__  
##   People who are low in power choose supersized foods and drinks to signal status
## 
## - __Less-is-better effect__  
##   People are willing to pay more money for a product that contains lower quantity when it looks more full, such as an overfilled ice cream cup with 7 oz rather than underfilled larger ice cream cup with 8 oz
## 
## - __Left digit bias__  
##   The leftmost digit of a number disproportionately influences decision making. Consumers judge the difference between $4.00 and $2.99 to be larger than that between $4.01 and $3.00, even though the numeric differences are identical; it is this change in the left digit, rather than the one cent drop, that affects the magnitude perception
## 
## - __Sensory marketing – Brand name sounds__  
##   Sound symbolism). The sound of a brand name can communicate information about the product, e.g. its size, speed, strength, weight, etc. Hypothetical brand names including front (vs. back) vowels are associated with smallness, fastness, softness, bitterness, friendliness, and prettiness. Hypothetical brand names including back (vs. front) vowels are associated with dark colour, mildness, richness, warmness, masculine, strong, and heaviness
## 
## - __Sensory marketing – Phonetic symbolism on brand name preference__  
##   Particular words are preferred as brand names when the phonetic connotations of the words are consistent with the product attributes. Front vowel sounds were preferred over back vowel sounds for convertible and knife; in contrast, back vowel sounds were preferred over front vowel sounds for 4 × 4 vehicle and hammer
## 
## - __Sensory marketing – Colour saturation and perceived product size__  
##   The perceived size of products depends on the saturation of their colour. Increasing colour saturation increases size perceptions; high (vs. low) saturation increases product size estimates, attention, and arousal
## 
## - __Sensory marketing – Healthy-left, unhealthy-right__  
##   Displaying healthy items to the left (vs. right) of unhealthy items enhances preference for the healthy options.​ Participants tend to prefer the healthy item (broccoli salad) when it is on the left (vs. right) of the images
## 
## - __Sensory marketing – Brand names and evaluation of products__  
##   Phonetic structure of brand names affects a consumer’s evaluation of products and their underlying attributes.​ Brand names including back (vs. front) vowels are rated as higher in the attribute perception index (richness, smoothness, and creaminess). The diagnostic information (true name, test name) and the timing of the information provided (simultaneously, afterward) modulate the effects of brand names on the attribute perception
## 
## - __Sensory marketing – Visual depiction effect__  
##   Visual product depictions within advertisements, such as the manipulation of orienting a product toward a participant’s dominant hand, facilitate purchase intention
## 
## - __Sensory marketing – Circular and angular logo shapes__  
##   Circular and angular-logo shapes influence consumers’ judgement of softness-related and hardness-related product attributes. The circular logo leads to more favourable perceptions of comfortableness (the softness-related attribute), whereas the angular logo leads to more favourable perceptions of durability (the hardness-related attribute
## 
## - __Sensory marketing – Past-left, future-right effect__  
##   When consumers view advertisements in which product images are positioned congruently (incongruently) with their spatial representation of time, they have more (less) favourable attitudes toward the product.​ When participants are primed to desire a modern product, they are more favourable when it appears on the right side of the advertisement; in contrast, when participants are primed to desire an antique, they are more favourable when the product appears on the left
## 
## - __Sensory marketing – Logo dynamism__  
##   Static visuals can evoke a perception of movement (i.e., dynamic imagery) and thereby affect consumer engagement and attitudes. The evoked dynamic imagery affects the level of consumer engagement with the brand logo. A logo that evokes greater perceived movement (logo dynamism) generates more favorable attitudes toward the brand
## 
## - __Sensory marketing – More is merrier__  
##   The number of product units displayed on a package biases consumers' perceptions of product quantity (i.e., the number of snack items the package contains) and actual consumption. Packages with more product units displayed on the package are perceived to contain more product quantity than packages with fewer product units displayed on the package
## 
## - __“Brain drain” effect__  
##   “Brain drain”** **effect**. The mere presence of one’s own smartphone may occupy limited-capacity cognitive resources, thereby leaving fewer resources available for other tasks and undercutting cognitive performance.​ The mere presence of these devices reduces available cognitive capacity
## 
## - __Goal conflict and work and leisure time spent__  
##   People who are faced with a goal conflict are (1) more likely to spend time on work and (2) less likely to spend time on leisure. This is because goal conflict increases reliance on salient justifications and work tends to be easier to justify and leisure harder to justify
## 
## - __Ad-type effect__  
##   In advertising a desired change, progression ads (which include intermediate steps in addition to starting and ending points) foster spontaneous simulation of the process through which the change will happen, which makes these ads more credible and, in turn, more persuasive than before/after ads (include visuals of the starting and ending point of the promised change).​
## 
## - __Product entitativity__  
##   Presenting multiple product replicates as a group (vs. presenting a single item) increases product efficacy perceptions because it leads consumers to perceive products as more homogenous and unified around a shared goal.​
## 
## - __Product anthropomorphism__  
##   Consumers are more likely to use a holistic process (vs. an attribute-by-attribute comparison) to judge anthropomorphized (human-like _products_) products.​ Anthropomorphism increases consumers’ use of an absolute judgement strategy (vs. a dimension-by-dimension strategy) in comparative judgement, leading to increased preference for the option with a more favourable overall evaluation over the option with a greater number of superior dimensions
## 
## - __Curiosity and indulgent consumption__  
##   Unsatisfied curiosity tempts indulgent consumption in domains unrelated to the source of the curiosity. Curiosity tempts indulgence
## 
## - __Self-concept and subscription choice__  
##   Consumers with “low self-concept clarity” are more motivated to keep their identities stable by (1) _retaining_ products that are relevant to their identities, and (2) choosing not to _acquire_ new products that are relevant to their identities
## 
## - __Self-construal and choices for others__  
##   Interdependent consumers consistently make choices that balance self and others’ preferences, regardless of group size. In contrast, the choices of independent consumers differ depending on group size: for smaller groups, independents make choices that balance self and others’ preferences, while for larger groups, they make choices that more strongly reflect their own preferences
## 
## - __Elevated viewpoints and risk taking__  
##   Consumers’ views of scenery from a high physical elevation induce an illusory source of control, which in turn intensifies risk taking.​
## 
## - __Tax aversion__  
##   Citizens prefer avoiding tax-related costs over avoiding tax-unrelated monetary costs of the same size.​
## 
## - __Rounded price effect__  
##   Because rounded numbers are more fluently processed, rounded prices (e.g., $200.00) encourage reliance on feelings. In contrast, because nonrounded numbers are disfluently processed, nonrounded prices (e.g., $198.76) encourage reliance on cognition.​
## 
## 
## **Neuroscience (humans**
## 
## - __One mind per hemisphere__  
##   split-brain syndrome). Surgical severing of the corpus callosum leads to the split-brain phenomenon, which is characterised by 1) a response × visual field interaction, 2) strong hemispheric specialisation 3) confabulations after left-hand actions 4) split attention, and 5) the inability to compare stimuli across the midline. Together, these reported effects have been interpreted as evidence for split consciousness. Surgical procedure does not result in the development of two independent minds or consciousnesses within one brain. Instead, the findings suggest that the two hemispheres continue to work together, even in the absence of the corpus callosum
## 
## - __Hydrocephaly__  
##   Hydrocephalus, also known as "water on the brain," is a condition in which there is an abnormal accumulation of cerebrospinal fluid (CSF) in the ventricular system of the brain. This can cause the ventricles to become enlarged, putting pressure on the brain and causing a wide range of symptoms, depending on the severity of the condition and the age of the individual. 
## 
## - __Readiness potentials__  
##   Readiness potentials (RP) are neural signals measured with electroencephalography (EEG) that are observed in the brain prior to voluntary movements, and are involved in movement preparation, and occur several hundred milliseconds before  movement onset. RP have been observed in various regions of the brain, including the primary motor cortex, supplementary motor area, and premotor cortex. RP have been discussed in philosophy in relation to free will. [Schurger](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8192467/) et al. (2021) for a glossary.
## 
## - __Left-Brain vs. Right-Brain Hypothesis__  
##   Hypothesis about individuals being either left-brain dominant or right-brain dominant based on personality and cognitive style. Specifically, the hypothesis proposes that the two hemispheres of the brain have different functions and abilities, with the left hemisphere being associated with logical, analytical, and verbal skills, and the right hemisphere being associated with creative, intuitive, and spatial skills. This idea has been popularised in popular culture, but it is not supported by scientific evidence.
## 
## - __Oxytocin on trust__  
##   Intranasal administration of oxytocin increases trust in strangers in a laboratory setting
## 
## - __Structural brain-behaviour correlations - the association between behavioural activation and white matter integrity__  
##   Individual differences in the sensitivity to signals of reward as indexed by BAS-Total are positively correlated with measures of white matter integrity
## 
## - __Structural brain-behaviour correlations - the association between social network size and grey matter volume__  
##   Structural brain behaviour correlations** - **The association between social network size and grey matter volume**. Individual differences in the number of Facebook friends (FBN) are positively correlated with grey matter volume in several brain areas: left middle temporal gyrus (MTG), right superior temporal sulcus (STS), rich entorhinal cortex (EC), left and right amygdala
## 
## - __Structural brain-behaviour correlations - the association between distractibility and grey matter volume__  
##   Variability in self-reported distractibility is positively correlated with grey matter volume in the left superior parietal lobule (SPL) and negatively correlated with grey matter volume in medial pre-frontal cortex (mPFC
## 
## - __Structural brain-behaviour correlations - the association between attention and cortical thickness__  
##   Individual differences in executive control are negatively correlated with cortical thickness in left anterior cingulate cortex (ACC), left superior temporal gyrus (STG), and right middle temporal gyrus (MTG), whereas variation in alerting scores is negatively correlated with cortical thickness in the left superior parietal lobule (SPL
## 
## - __Structural brain-behaviour correlations - the association between control over speed/accuracy of perceptual decisions and white matter tracts strength__  
##   Individual differences in control over speed and accuracy of perceptual decisions are positively correlated with the strength of white matter tracts between the right presupplementary motor area (pre-SMA) and the right striatum
## 
## - __Structural brain-behaviour associations: the association between executive function and grey matter volume__  
##   Grey matter volume in the rostral dorsal premotor cortex is associated with individual differences in executive function as measured by the trail making test
## 
## - __Fear conditioning - Amygdala__  
##   Animal research suggests that fear conditioning activates the amygdala ([LeDoux, 1993](https://doi.org/10.1111/j.1749-6632.1993.tb17246.x)), which has been replicated in some (but not all) human fMRI fear conditioning studies
## 
## - __Fear conditioning - vmPFC__  
##   Animal research suggests that fear extinction activates the vmPFC ([Morgan et al., 1993](https://doi.org/10.1016/0304-3940(93)90241-C)); based on these findings from animal research, some (but not all) human fMRI fear conditioning/extinction studies found that the vmPFC becomes activated during fear extinction recall
## 
## - __Fear conditioning - Theta Oscillations__  
##   Fear conditioning - Theta oscillations**. Animal research suggests that fear conditioning evokes prefrontal theta activity, which can be measured with EEG in humans
## 
## - __Fear conditioning - Late Positive Potential (LPP)__  
##   Fear conditioning leads to elevated amplitudes during the time period of the Late Positive Potential (LPP), i.e., a positive-going event-related brain potential (ERP) component​ that can be recorded using electroencephalography (EEG
## 
## - __Fear conditioning - Bradycardia / heart rate modulation__  
##   Fear conditioning leads to heart rate slowing (fear-conditioned bradycardia
## 
## - __Bouba/kiki effect__  
##   sound symbolism). When presented with sounds (e.g., the words “bouba” and “kiki”) and visual objects (e.g., a curvy shape and a spiky shape), humans make non-arbitrary mappings between sounds and objects (e.g., the curvy shape is consistently called “bouba”
## 
## - __Human freezing like behaviour (postural sway) in threat processing__  
##   Human freezing behaviour **(postural sway). A physiological response that occurs in response to a perceived threat. Overall, freezing-like behaviour has been replicated in multiple studies across different species and contexts, and is considered a robust and reliable measure of fear and anxiety
## 
## - __Glucose amplification of cortisol stress reactivity__  
##   After fasting, the administration of glucose prior to psychosocial stress or a nicotine challenge led to an increased cortisol stress response (in comparison to water administration). ​Blood glucose levels were positively associated with the cortisol stress response triggered by the Trier Social Stress Test (TSST
## 
## - __Resting-state functional connectivity patterns can accurately classify individuals diagnosed with depression__  
##   Multivariate pattern analyses can identify patterns of resting-state functional connectivity that successfully differentiate individuals with depression from healthy controls. This finding demonstrates the potential utility of resting-state functional connectivity as a biomarker of depression
## 
## - __Mozart effect on epilepsy__  
##   Listening to Mozart’s sonata KV448 can reduce or prevent epileptic seizures.​
## 
## - __Effect of Alzheimer's disease on financial capacity performance in older adults__  
##   Effect of Alzheimer’s disease on financial capacity performance in older adults**. The influence of neurodegeneration as presented in patients with a diagnosis of Alzheimer’s disease on financial capacity tasks.​
## 
## - __Effect of Parkinson's disease on financial capacity performance in older adults__  
##   Effect of Parkinson’s disease on financial capacity performance in older adults.** The influence of neurodegeneration as presented in patients with a diagnosis of Parkinson’s disease on financial capacity tasks
## 
## - __Effect of Mild Cognitive Impairment on financial capacity performance in older adults__  
##   Effect of Mild Cognitive Impairment (MCI) on financial capacity performance in older adults. **The influence of neurodegeneration as presented in patients with a diagnosis of Mild Cognitive Impairment on financial capacity tasks
## 
## - __Effect of frontotemporal dementia on financial capacity performance in older adults__  
##   The influence of neurodegeneration as presented in patients with a diagnosis of frontotemporal dementia on financial capacity tasks
## 
## - __Fear Conditioning - Association between cortical thickness of the medial orbitofrontal cortex (mOFC) and the extinction retention index (ERI)__  
##   Fear Conditioning - Association of cortical thickness of the medial orbitofrontal cortex (mOFC) and the extinction retention index (ERI)** (Brain-behaviour relationships in fear conditioning). The relationship between the thickness of the mOFC and the extinction retention index in fear conditioning paradigms.​
## 
## - __Fear Conditioning - Association between cortical thickness of the dorsal anterior cingulate cortex (dACC) and conditioned responding during acquisition training__  
##   Fear Conditioning - Association of cortical thickness between the dorsal anterior cingulate cortex (dACC) and conditioned responding during acquisition training** (Brain-behaviour relationships in fear conditioning). The relationship between the thickness of dACC and conditioned responding during fear acquisition training in fear conditioning paradigms.​
## 
## - __Fear Conditioning - Association between amygdala volume and conditioned responding during acquisition training__  
##   Brain-behaviour relationships in fear conditioning). The relationship between the subcortical volume of the amygdala and conditioned responding during acquisition training in fear conditioning paradigms.​
## 
## 
## **Parapsychology**
## 
## - __Precognition__  
##   Undergraduates improve memory test performance by studying after the test
## 
## 
## **Personality Psychology**
## 
## - __Fear conditioning - Anxiety__  
##   Fear conditioning - effect of trait anxiety/neuroticism on conditioning**. High trait anxiety/neuroticism leads to better fear conditioning. Evidence is mixed; some papers even find the reversed effect, depending on experimental paradigm (in particular, single-cue conditioning versus differential conditioning).​
## 
## - __Fear conditioning - Extraversion__  
##   Fear conditioning - effect of trait extraversion on conditioning**. Low trait extraversion leads to better fear conditioning
## 
## - __Effects of personality and education on health behaviour__  
##   effect of personality on the education gradient). Personality moderates the relationship between education and health behaviours
## 
## 
## **Political Psychology**
## 
## - __Stereotype threat on gender differences in political knowledge__  
##   Making gender stereotypes about political knowledge salient decreases womens’ performance on political knowledge tests
## 
## - __Avoidance of dissonance-arousing situations__  
##   Ideological asymmetry in dissonance avoidance)**. **There are differences in how liberals and conservatives respond to dissonance-arousing situations – conservatives are more strongly motivated to avoid dissonance-arousing tasks than liberals.​​
## 
## - __Depressed-entitlement effect among women__  
##   In the absence of clear-cut standards of comparison, women reward/pay themselves significantly less money than do men for the same amount of work
## 
## - __Gender effects of political candidates__  
##   Voters evaluate political candidates based on their gender or sex
## 
## - __Race/ethnicity effects of political candidates__  
##   Voters evaluate political candidates based on their race or ethnicity
## 
## - __The democratic peace__  
##   Citizens of democratic states are significantly more likely to approve of war against non-democratic states than war against other democracies.​
## 
## - __Moral foundations across the political spectrum__  
##   Moral Foundations Theory is a framework that claims that humans have five innate and universal moral values: Care, Fairness, Loyalty, Authority, and Purity. While extremely influential, it has failed to replicate, with studies critiquing its factor structure (Harper and Rhodes 2020) and universality (Davis et. al. 2016) .​
## 
## - __Backfire__  
##   Being confronted with corrections of previously held political misconceptions can lead to an even increased alignment with those misperceptions
## 
## - __Conspiracy mentality and political extremism__  
##   Refers to a positive relationship between** **the general tendency to endorse conspiracy theories (i.e., conspiracy mentality) and the political ideologies at either side of the political spectrum (i.e., extreme political ideologies
## 
## - __Voters "elect" rather than "affect" policies__  
##   Voters elect rather than affect policies.** Elected politicians do not change their policies (measured through roll call votes) in response to changes in the median voters policy preferences. This means that voters merely elect politicians with policies that they support, but that they do not affect these politicians policies afterward
## 
## - __Personality correlates of sociopolitical attitudes__  
##   Liberals tend to socially conform whereas conservatives are more willing to violate established societal conventions
## 
## - __Attractive politician effect__  
##   Voters tend to vote more for physically attractive candidates and politicians
## 
## - __Working-class authoritarianism__  
##   The lower (or working) classes are more likely to possess authoritarian tendencies and to favour the ideology of anti-democratic movements in comparison with their middle and higher class counterparts
## 
## - __Political Tolerance Asymmetry__  
##   Asymmetry Hypothesis of Tolerance). Political tolerance and intolerance differ in their underlying psychology, making it easier to persuade the tolerant to become less tolerant than to convince the intolerant to become more tolerant.​
## 
## - __Cognitive ability of the right-wing – conservatism__  
##   Cognitive ability of the right-wing - conservatism**. Lower cognitive ability is associated with stronger endorsement of conservative attitudes.​
## 
## - __Cognitive ability of the right-wing – authoritarianism__  
##   Cognitive ability of the right-wing - authoritarianism**. Lower cognitive ability is associated with higher authoritarianism.​
## 
## - __Cognitive ability of the right-wing – dogmatism__  
##   Cognitive ability of the right-wing - dogmatism**. Lower cognitive ability is associated with higher dogmatism.​
## 
## - __Cognitive ability of the right-wing – ethnocentrism__  
##   Cognitive ability of the right-wing - ethnocentrism**. Lower cognitive ability is associated with higher ethnocentrism.​
## 
## - __Rigidity-of-the-right hypothesis – general conservatism__  
##   Rigidity-of-the-right hypothesis**. Conservative political ideology is congenial to people who are cognitively, motivationally, and ideologically rigid.​
## 
## - __Rigidity-of-the-right hypothesis – economic conservatism__  
##   Rigidity-of-the-right hypothesis**. Economic conservatism is congenial to people who are cognitively, motivationally, and ideologically rigid.​
## 
## - __Rigidity-of-the-right hypothesis – social conservatism__  
##   Rigidity-of-the-right hypothesis**. Social conservatism is congenial to people who are cognitively, motivationally, and ideologically rigid.​
## 
## - __Motivated numeracy__  
##   People with higher numeracy are less accurate in evaluating contingency tables when the outcome is aligned with their politics
## 
## - __Conscientious conservatives fake news sharing__  
##   Personality moderates the relationship between political ideology and the sharing of misinformation; conscientious conservatives share less fake news.​
## 
## 
## **Positive Psychology**
## 
## - __Power pose__  
##   Taking on a power pose lowers cortisol and risk tolerance, while it raises testosterone and feelings of power
## 
## - __Facial Feedback__  
##   Smiling causes a good mood, while pouting produces a bad mood
## 
## - __Positive affirmation on mood__  
##   Positive self-statements boost mood for people with high self-esteem and reduce mood for people with low self-esteem
## 
## - __Mindfulness for mental health__  
##   Mindfulness, the practice of paying attention to the present moment in a non-judgemental way, is thought to have a beneficial effect on mental health outcomes, including but not limited to helping individuals reduce stress and anxiety and manage emotional states more effectively
## 
## - __Grit and Well-being__  
##   Grittier people, those pursuing long-term goals with perseverance and passion, have greater subjective well-being
## 
## 
## **Psychiatry/Mental Health**
## 
## - __Low self-esteem on poor mental health/psychological outcomes__  
##   Poor self-esteem results in a decrease in self-appreciation, producing self-defeating attitudes, poor mental health, social problems or risk behaviours
## 
## - __Rorschach Test__  
##   A projective psychological test developed by Herrmann Rorschach in which subjects' perceptions of inkblots are recorded and analysed in an attempt to describe a subject’s personality. The Rorschach test is generally considered to be an unreliable method for psychological assessments and diagnoses.
## 
## - __Lunar effect__  
##   Transylvania effect). Full moons lead to strange occurrences in human behaviour. ​
## 
## - __Lack of a Theory of Mind in autistic people__  
##   Lack of a Theory of Mind is universal in autism**. All autistic people fail to understand that other people have a mind or that they themselves have a mind
## 
## - __Childhood adversity and drug liking/enjoyment__  
##   Childhood adversity and drug-induced feeling good and drug liking**. Childhood adversity increases drug liking and feeling good
## 
## - __Early Life Adversity and (Adult) Depression__  
##   Early life adversity (childhood maltreatment) is associated with higher depression symptoms
## 
## - __Lead and criminality__  
##   Excess risk for criminal behaviour in adulthood exists when an individual is exposed to lead in utero or in the early years of childhood.​
## 
## - __Physical activity and depression__  
##   Physical activity is highly beneficial for improving symptoms of depression across a wide range of adult populations, compared with usual care or no treatment.​
## 
## - __Physical activity and anxiety__  
##   Physical activity is highly beneficial for improving symptoms of anxiety across a wide range of adult populations, compared with usual care or no treatment.​
## 
## 
## **Psychophysiology**
## 
## - __Sympathetic nervous system activity predicts political ideology__  
##   There are psychophysiological correlates of political ideology – conservatives react with higher levels of electrodermal activity (EDA)/ skin conductance to threatening stimuli than liberals
## 
## 
## **Social Psychology**
## 
## - __Elderly priming__  
##   Thinking about old age makes people walk slower.
## 
## - __Hostility priming (unscrambled sentences)__  
##   Exposing participants to more hostility-related stimuli caused them subsequently to interpret ambiguous behaviours as more hostile
## 
## - __Intelligence priming (contemplation)__  
##   professor priming).** Participants primed with a category associated with intelligence (e.g. “professor”) performed 13% better on a trivia test than participants primed with a category associated with a lack of intelligence (“soccer hooligans”
## 
## - __Moral priming (cleanliness)__  
##   Participants exposed to physical cleanliness were shown to reduce the severity of their moral judgments
## 
## - __Moral priming (contemplation)__  
##   Participants exposed to a moral-reminder prime would demonstrate reduced cheating
## 
## - __Distance priming__  
##   Participants primed with distance compared to closeness produced greater enjoyment of media depicting embarrassment (Study 1), less emotional distress from violent media (Study 2), lower estimates of the number of calories in unhealthy food (Study 3), and weaker reports of emotional attachments to family members and hometowns (Study 4
## 
## - __Flag priming__  
##   Participants primed by a flag are more likely to be more in conservative positions than those in the control condition
## 
## - __Fluency priming__  
##   Objects that are fluent (e.g., conceptually fluent, visually fluent) are perceived more concretely than objects that are disfluent (disfluent objects are perceived more abstractly
## 
## - __Money priming__  
##   Images or phrases related to money cause increased faith in capitalism, and the belief that victims deserve their fate
## 
## - __Commitment priming (recall)__  
##   Participants exposed to a high-commitment prime would exhibit greater forgiveness
## 
## - __Mortality Salience__  
##   Death Priming/Terror Management Theory). Reminders of death lead to subconscious changes in attitudes and behaviour, for example in the form of increased in-group bias and behaviour that serves to defend an individual’s cultural worldview
## 
## - __Spatial priming for emotional closeness__  
##   Plotting points closer together led to participants reporting they were closer to their own family members than those who plotted points farther apart
## 
## - __Implicit God prime increases actual risky behaviour__  
##   Implicitly priming God using the scrambled-sentence paradigm increases willingness to engage in risky behaviour for financial reward
## 
## - __Implicit God prime increases self-reported risky behaviour__  
##   Implicitly priming God using the scrambled-sentence paradigm increases self-reported risk taking
## 
## - __Implicit religious priming__  
##   Implicitly priming god concepts by unscrambling sentences with words relating to religion increases prosocial behaviour in an anonymous economic game
## 
## - __Heat priming__  
##   Exposure to words related to hot temperatures increases aggressive thoughts and hostile perceptions (heat - aggression association)
## 
## - __Honesty priming__  
##   ​​Honesty priming** (goal-priming, social priming). An increased level of honesty to embarrassing behaviours after exposure to honesty-related words
## 
## - __Achievement priming__  
##   goal priming, high-performance goal priming). Exposing individuals to words that are success oriented (e.g., win, strive) will increase their performance on a task compared to those exposed to neutral words (e.g., carpet, shampoo).​
## 
## - __Weapons priming effect__  
##   weapons effect). Stimuli or cues associated with aggression, such as weapons, can elicit aggressive responses
## 
## - __Goal priming effect__  
##   goal contagion, goal inspiration, behavioural inspiration). The observation of other’ behaviour (e.g., your observe someone jogging in the park) may lead to the inference of the goal in the observer (“This person wants to keep fit.”) and to the adoption of the same goal (“Maybe I should do some sports too.”
## 
## - __Olfactory priming of cleaning behaviour__  
##   scent priming, sensory priming). People who were exposed to a lemon scent were more likely to engage in a range of cleaning-related behaviours and have more rapid access to cleaning-related concepts, compared to people who were not exposed to a lemon-scent. This finding suggests that olfactory cues can be processed unconsciously and impact people’s cognition and downstream behaviour
## 
## - __Verbal framing (temporal tense)__  
##   Participants who read what a person **was doing** (relative to those who read what person **did**) showed enhanced accessibility of intention-related concepts and attributed more intentionality to the person
## 
## - __Reference framing__  
##   Risk preferences change depending on whether a choice is presented in terms of gains or losses, even when the prospects of the options are held constant.​
## 
## - __Prosocial spending__  
##   Spending money on other people leads to greater happiness than spending money on oneself
## 
## - __Gustatory disgust on moral judgement__  
##   Gustatory disgust triggers a heightened sense of moral wrongness
## 
## - __Macbeth effect__  
##   Moral aspersions induce literal physical hygiene
## 
## - __Signing at the beginning rather than end makes ethics salient__  
##   Signing a statement of honest intent before providing information rather than after can reduce dishonesty
## 
## - __Social class on prosocial behaviour__  
##   Individuals from a high social class are more likely to exhibit prosocial behaviour than those from a low social class, but there is a U-shaped curve between social class and prosocial behaviour that sometimes appears
## 
## - __Stanford Prison Experiment__  
##   employed a simulation of a prison environment to examine the psychological effects of coercive situations. Utilising role-playing, labelling and social expectations it showed that one third of participants in the role of prison guards displayed aggressive and dehumanising behaviour
## 
## - __Milgram experiment__  
##   was a study examining the influence of authority on immoral behaviour. Participants were assigned the role of ‘teachers’ and they were instructed by the experimentator to administer electric shocks** **of** **15-450 V voltage, whenever the ‘learner’ made a mistake. There were various variants of the study. In the most basic one, 100% of participants agree to administer a 300 V shock and 65% agreed to apply to maximum shock of 450 V
## 
## - __Robbers Cave Study__  
##   Utilised arbitrary groupings to demonstrate that tribalism between groups arises spontaneously, and depending on the context, it can result in group competition (e.g., in case of scarce resources) or group cooperation (e.g., in case of superordinate goals and common obstacles
## 
## - __Digital technology use and adolescent wellbeing__  
##   Adolescents who spend more time on new media (including social media and electronic devices such as smartphones) are more likely to report mental health issues
## 
## - __Anthropomorphism__  
##   Individuals who are lonely are more likely than people who are not lonely to attribute humanlike traits (e.g., free will) to nonhuman agents (e.g., an alarm clock),to fulfil unmet needs for belongingness
## 
## - __Female-named hurricanes are more deadly than male-named ones__  
##   Original effect size was a 176% increase in deaths, driven entirely by four outliers; reanalysis using a greatly expanded historical dataset found a nonsignificant decrease in deaths from female named storms
## 
## - __Implicit bias testing for racism__  
##   Implicit bias scores poorly predict actual bias, _r_ = 0.15. The operationalisations used to measure that predictive power are often unrelated to actual discrimination (e.g. ambiguous brain activations). Test-retest reliability of 0.44 for race, which is usually classed as “unacceptable”. This isn’t news; the original study also found very low test-criterion correlations
## 
## - __Pygmalion effect__  
##   Rosenthal Effect, self-fulfilling prophecy). Expectations about performance (e.g., academic achievement) impact performance. Specifically, teachers' expectations about their students’ abilities affect those students’ academic achievement; teacher beliefs impact their behaviour which in turn impacts student beliefs and behaviour
## 
## - __Stereotype threat on Asian women’s mathematical performance__  
##   stereotype lift), i.e. the interaction between race, gender and stereotyping. This study found that Asian-American women performed better on a maths test when their ethnic identity was activated, but worse when their gender identity was activated, compared with a control group who had neither identity activated
## 
## - __Stereotype threat on girls’ mathematical performance__  
##   A situational phenomenon whereby priming a negative gender stereotype (e.g., “women are bad at maths”) has a detrimental impact on mathematical performance
## 
## - __Increase in narcissism__  
##   leadership, vanity, entitlement) in young people over the last thirty years. It's [an ancient hypothesis.](https://quoteinvestigator.com/2010/05/01/misbehave) The basic counterargument is that they’re misidentifying an age effect as a cohort effect (The narcissism construct [apparently](https://journals.sagepub.com/doi/abs/10.1177/1745691609357019) decreases by about a standard deviation between adolescence and retirement.) “every generation is Generation Me”
## 
## - __Minimal group effect (MGE)__  
##   Minimal group effect** **(MGE)** (Minimal group paradigm). An intergroup bias that manifests as ingroup favouritism (i.e., a tendency to prefer ingroup members) when participants are assigned to previously unfamiliar, experimentally created and largely meaningless social identities. In essence, the paradigm investigates the impact of social categorization on intergroup relations in the absence of realistic conflicts of interests, showing that mere social categorization is sufficient to produce ingroup favouritism
## 
## - __Solomon Asch’s conformity__  
##   study. **The degree to which a person's own opinions are influenced by those of a group
## 
## - __Dynamic norms__  
##   Information about increasing minority norms increases interest/engagement in minority behaviour.​
## 
## - __Social comparison__  
##   No robust evidence for an interaction effect between body dissatisfaction and social comparison on fat talk
## 
## - __Bystander effect__  
##   claims that the feeling of responsibility diffuses with an increasing number of other observers. Research about the bystander effect was sparked by the 1964 murder of Catherine “Kitty” Genovese. See this _[New York Times article](https://www.nytimes.com/1964/03/27/archives/37-who-saw-murder-didnt-call-the-police-apathy-at-stabbing-of.html)_ for details. Here’s a more detailed [resource](http://bps.stanford.edu/?page_id=3671
## 
## - __Colour red on attractiveness__  
##   Viewing the colour red enhances men's attraction to women. In a lingua franca this effect may reflect the amorous meaning in the human mating game. ​
## 
## - __Big brother effect__  
##   Being watched makes someone more likely to cooperate
## 
## - __Imagined Contact - _Bias___  
##   Imagined Contact**. Imagining social contact (instead of having actual contact) with someone from an outgroup (based on e.g., ethnicity, sexuality, religion, age) can reduce intergroup bias
## 
## - __Imagined Contact - _Intentions___  
##   Imagined Contact**. the claim that imagining social contact (instead of having actual contact) with someone from an outgroup (based on e.g., ethnicity, sexuality, religion, age) can increase **contact intentions
## 
## - __Stereotype susceptibility effects__  
##   Awareness of stereotypes about a person’s in-group can affect a person’s behaviour and performance when they complete a stereotype-relevant task.​
## 
## - __Positive mood-boost helping effect__  
##   People are more likely to do good when feeling good
## 
## - __Superiority-of-unconscious decision-making effect__  
##   deliberation without attention effect). While conscious reflection produces better choices on simple tasks, complex choices “should be left to unconscious thought”.​
## 
## - __Behavioural-consequences-of-automatic-evaluation__  
##   Behavioural-consequences-of automatic-evaluation **(affective compatibility effect).** **Automatic classification of stimuli as either good or bad have direct behavioural consequences.​ Automatic evaluation results directly in behavioural predispositions toward the stimulus, such that positive evaluations produce immediate approach tendencies, and negative evaluations produce immediate avoidance tendencies
## 
## - __Self-control relies on glucose effect__  
##   Acts of self-control decrease blood glucose levels; low levels of blood glucose predict poor performance on self-control tasks; initial acts of self-control impair performance on subsequent self-control tasks, but consuming a glucose drink eliminates these impairments
## 
## - __Physical warmth promotes interpersonal warmth__  
##   Exposure to physical warmth will lead to more positive judgments of strangers and an increase in prosocial behaviour (e.g., gift-giving
## 
## - __Power impairs perspective-taking effect__  
##   Individuals made to feel high in power were more likely to inaccurately assume that others view the social world from the same perspective as they do
## 
## - __Status-legitimacy effect__  
##   Members of low-status, disadvantaged, and marginalised groups are more likely to perceive their social systems as legitimate than their high-status and advantaged counterparts under certain circumstances. People who are most disadvantaged by the status quo, due to the greatest psychological need to reduce ideological dissonance, are most likely to support, defend, and justify existing social systems, authorities, and outcomes.​
## 
## - __Red impairs cognitive performance effect__  
##   Red impairs cognitive performance**. The colour red impairs performance on achievement tasks, as red is associated with the danger of failure and evokes avoidance motivation
## 
## - __Reduced prosociality of high SES effect__  
##   Higher socioeconomic status predicts decreased prosocial behaviour. Affluence may be linked with reduced empathy and poverty may be linked with increased empathy
## 
## - __Moral licensing effect__  
##   self-licensing, moral self-licensing, licensing effect) is the effect that acting in a moral way makes people more likely to excuse and perform subsequent immoral, unethical, or otherwise problematic behaviours
## 
## - __Colour on approach/avoidance__  
##   Red (versus blue) colour induces primarily an avoidance (versus approach) motivation and enhances performance on a detail-oriented task, whereas blue enhances performance on a creative task.​
## 
## - __Playboy effect__  
##   Playboy Effect.** Men exposed to erotic images of the opposite-sex will report lower ratings of love for their partner and lower ratings for their partners sexual attractiveness compared to men exposed to abstract art. This effect was not found in women in either the original or replication attempts
## 
## - __Self-protective subjective temporal distance effect__  
##   Participants reported that negative events in their own lives felt farther away than positive events in their own lives, and this effect was stronger for participants higher in self-esteem
## 
## - __Trait loneliness hot shower effect__  
##   People self-regulate their feelings of social warmth (connectedness to others) through applications of physical warmth of shower or bath, without explicit awareness of this substitution. Loneliness as a form of “social coldness” can be relieved by applying physical warmth
## 
## - __American flag priming boosts Republican support__  
##   Subtle exposure to the American flag causes people to report more conservative, Republican beliefs and attitudes
## 
## - __Unethicality darkens perception of light__  
##   El Greco fallacy). Recalling abstract concepts such as evil (as exemplified by unethical deeds) and goodness (as exemplified by ethical deeds) can influence the sensory experience of the brightness of light. Recalling unethical behaviour led participants to see the room as darker and to desire more light-emitting products (e.g., a flashlight) compared to recalling ethical behaviour
## 
## - __Fertility on voting__  
##   Ovulation effect). Ovulatory (or high-fertility) phase of the menstrual cycle affects voting preferences and has different effects on women who are single then women who are in committed relationships. Single women were more likely to vote for Barack Obama (liberal/Democrat candidate) if they were ovulating then if they were not, while the opposite was true for women in committed relationship – ovulation led them more likely to vote for Mitt Romney (conservative/Republican candidate).​
## 
## - __Modulation of 1/f noise on the weapon identification task__  
##   Making an effort to modulate the use of racial information decreases the emission of 1/f noise
## 
## - __Time is money effect__  
##   Putting a price on time can influence enjoyment of leisure activities as individuals get more impatient if they are compensated for engaging in these activities. ​
## 
## - __Embodiment of secrets__  
##   secrets-as-burdens). Secrets are experienced as physical burdens, influencing how people perceive and act in the world.​ People who recalled, were preoccupied with, or suppressed an important secret estimated hills to be steeper and perceived distances to be farther
## 
## - __Warmer-hearts-warmer-room effect__  
##   Priming “warm” communal traits (vs. other traits) led participants to report that the room in which they were taking the study was warmer
## 
## - __Treating-prejudice-with-imagery effect__  
##   Imagining a positive encounter with a member of a stigmatised group promote positive perceptions when it was preceded by imagined negative encounter.​
## 
## - __Enclothed cognition – Attention__  
##   Enclothed cognition - Attention**. Enclothed cognition refers to the systematic influence that clothes can have on the wearer’s feelings, thoughts, and behaviours through their symbolic meaning. For example, the association between a doctor's coat and intelligence can lend the wearer an increased ability in selective and sustained attention tasks
## 
## - __Enclothed cognition – Behaviour__  
##   Enclothed cognition - Behavior**. Enclothed cognition refers to the systematic influence that clothes can have on the wearer’s feelings, thoughts, and behaviours through their symbolic meaning. For example, the association between a doctor's coat and intelligence can lend the wearer an increased ability in selective and sustained attention tasks
## 
## - __Enclothed cognition – State__  
##   Enclothed cognition - State**. Enclothed cognition refers to the systematic influence that clothes can have on the wearer’s feelings, thoughts, and behaviors through their symbolic meaning. For example, the association between a doctor's coat and intelligence can lend the wearer an increased ability in selective and sustained attention tasks
## 
## - __Grammar influences perceived intentionality effect__  
##   Grammar influences perceived intentionality**. Describing a person's behaviours in terms of what the person _was doing _(rather than what the person _did_) enhances intentionality attributions in the context of both mundane and criminal behaviors.​ Participants judged actions described in the imperfective as being more intentional and they imagined these actions in more detail
## 
## - __Attachment-warmth embodiment effect__  
##   anxious attachment warm food effect) Attachment anxiety positively predicts sensitivity to temperature cues.​ Individuals with high (but not low) attachment anxiety report higher desires for warm foods (but not neutral foods) when attachment is activated
## 
## - __Superstition boosts performance effect__  
##   The irrational belief that certain objects (e.g., lucky charms) or beliefs (e.g., religion) will benefit performance in a task.​
## 
## - __Social and personal power__  
##   Social power (power over other people) and personal power (freedom from other people) have opposite associations with independence and interdependence; they have opposite effects on stereotyping (social power decreases and personal power increases stereotyping), but parallel effects on behavioural approach (both types of power increase it
## 
## - __Classical anchoring effect__  
##   anchoring and adjustment). Assimilation of numeric estimates toward previously considered numeric values. ​
## 
## - __Incidental environmental anchoring effect__  
##   Anchor values that are incidentally present in the environment can affect a person’s numerical estimates, Item: Restaurant
## 
## - __Subliminal anchoring effect__  
##   subliminal anchoring). Numeric estimates are biassed toward previously, subliminally presented numbers that could not be perceived by respondents.​
## 
## - __Facial Colours and perceived emotions__  
##   Facial redness increased perceived anger.** When people rate faces and these are red, rated anger is positively associated with the faces’ redness.​
## 
## - __Romeo and Juliet effect__  
##   Greater love and commitment towards a romantic partner when others (e.g., parents, friends) are observed to interfere with, or disapprove of, the relationship.​
## 
## - __Stereotype activation effect__  
##   Judgments of targets that follow gender-congruent primes are made faster than judgments of targets that follow gender-incongruent primes.​
## 
## - __Sex difference in distress to infidelity__  
##   Men, compared to women, are more distressed by sexual than emotional infidelity, and this sex difference continued into older age.​
## 
## - __Content effect for cheater detection__  
##   There is a performance improvement on the Wason selection task if it involves cheater detection. College students were better able to complete the selection task for unfamiliar scenarios if it involved detecting a cheater instead of a descriptive scenario
## 
## - __Dissenting deviant social rejection effect__  
##   Groups reject opinion deviates from future interaction
## 
## - __Sex differences in implicit maths attitudes__  
##   College students, especially women, demonstrated negativity toward maths and science relative to arts and language on implicit measures.​
## 
## - __Low versus high category scale effect on behaviour self – report__  
##   Low versus high category scale effect on behaviour self-report**. Response scales serve informative functions. The response categories suggest a range of "usual" or "expected" behaviours, and this information affects respondents' behavioural reports as well as related judgments
## 
## - __Information source on attitudes effect__  
##   The source of information has a major impact on how that information is perceived and evaluated
## 
## - __Inoculation effect__  
##   People who are pre-exposed to weakened arguments against an attitude or position they currently hold (i.e., inoculated) are less affected by a subsequent strong counter-attitudinal message than people who are pre-exposed to arguments consistent with their attitude (i.e., supportive defence treatment) or to no arguments.​
## 
## - __Door-in-the-face effect__  
##   The door-in-the-face effect occurs when making a larger initial request and then afterwards scaling back and asking a more moderate request increases compliance (with the moderate request) compared to either starting with the moderate request or starting with a small request
## 
## - __Foot-in-the-door effect__  
##   The foot-in-the-door effect occurs when getting people to comply with a very small initial request increases the likelihood that they will agree to a larger request (compared to starting with the larger request
## 
## - __Ingroup-outgroup norm of reciprocity effect__  
##   “When confronted with a decision about allowing or denying the same behaviour to an ingroup and outgroup, people may feel an obligation to reciprocity, or consistency in their evaluation of the behaviours.”
## 
## - __Social dominance-status__  
##   verticality effects). Vertical dimension of human relations (such as dominance and submission) and nonverbal behaviour are intimately and fruitfully linked; nonverbal behaviour, such as gazing, smiling, touching, and various body positions can signal high and low verticality
## 
## - __Personal cognitive dissonance - free-choice paradigm__  
##   Personal cognitive dissonance, from the cognitive dissonance theory (Festinger, 1957), suggests that an inconsistency between two cognitions (e.g., an attitude and a past behaviour) creates an unpleasant psychological state (i.e., personal dissonance) that the individual is motivated to reduce (e.g., by changing one of the elements to fit the other). This personal cognitive dissonance has been studied in the literature through different paradigms, including the following three main ones: free-choice, induced-compliance and induced-hypocrisy paradigm. The mere act of choosing equally desirable options can arouse dissonance in the individual, because choosing option A implies the rejection of option B (in other words, choosing option A means accepting its advantages but also its disadvantages, but also accepting to deprive oneself of the advantages of option B). In order to reduce dissonance, subjects will increase the perceived gap between options (i.e., spreading of alternatives) by overestimating the chosen option and/or underestimating the rejected option. ​
## 
## - __Personal cognitive dissonance - induced-compliance paradigm__  
##   In this paradigm, subjects are led to perform, in a context of free choice, an inconsistent act with their own norms or social norms (e.g., agree to perform a counter-attitudinal act). Dissonance can be resolved through multiple modes of reduction (e.g., social support, trivialization, etc.), but attitude change remains the most studied mode of reduction.​
## 
## - __Personal cognitive dissonance - induced-hypocrisy paradigm__  
##   Personal cognitive dissonance - Induced-hypocrisy paradigm**. In this paradigm, dissonance is aroused by making individuals aware of the discrepancy between a socially desirable behaviour (e.g., not wasting water; stage 1: normative commitment phase) and their own past transgressive behaviours (e.g., remembering one's past water waste; stage 2: transgression salience phase). Most of the dissonance reduction work is done through behavioural means, and leads subjects to express behavioural intentions, and/or perform behaviours in the direction of the socially desirable behaviours expressed in step 1 (i.e., allowing for the reduction of the inconsistency between the norm, step 1, and the recall of transgressions, step 2).​
## 
## - __Vicarious cognitive dissonance - induced-compliance paradigm__  
##   Vicarious cognitive dissonance, from the cognitive dissonance theory (Festinger, 1957; see “personal cognitive dissonance”), suggests that it would be possible for an individual to experience dissonance vicariously when they witness the performance of inconsistent act (e.g., counter-attitudinal or counter-normative behaviour) on the part of an in-group member with whom they strongly identify. As a personal cognitive dissonance, the inconsistency between two cognitions (e.g., between attitude and observed behaviour) creates an unpleasant psychological state (i.e., vicarious dissonance) that the individual is motivated to reduce (e.g., by changing one of the elements to fit the other). This vicarious cognitive dissonance has been studied in the literature through different paradigms, including the following two main ones: induced-compliance and induced-hypocrisy paradigm. In this paradigm, subjects are led to observe the realisation, by a member of their in-group, of a counter-attitudinal act with their own norms or social norms (e.g., agree to perform a counter-attitudinal act), performed in a context of free choice. Dissonance can be resolved through multiple modes of reduction (e.g., social support, trivialization, ect.), but attitude change remains the most studied mode of reduction.​
## 
## - __Vicarious cognitive dissonance - induced hypocrisy paradigm__  
##   Vicarious cognitive dissonance - Induced-hypocrisy paradigm**. In this paradigm, subjects are made to observe a member of their group becoming aware of the discrepancy between a socially desirable behaviour (e.g., not wasting water; stage 1: normative commitment phase) and their own past transgressive behaviours (e.g., remembering one's past water waste; stage 2: transgression salience phase). Most of the dissonance reduction work is done through behavioural means, and leads subjects to express behavioural intentions, and/or perform behaviours in the direction of the socially desirable behaviours expressed in step 1 (i.e., allowing for the reduction of the inconsistency between the norm, step 1, and the recall of transgressions, step 2).​
## 
## - __Impostor phenomenon__  
##   Imposter phenomenon**. People who perform outstandingly both academically and professionally believe that in fact, they are not really bright and that they have fooled anyone who thinks otherwise. This phenomenon might be especially persistent in women. Key conclusion: Therapeutic interventions might help to overcome imposter syndrome
## 
## - __Ability Emotional Intelligence as a Second Stratum Factor of Intelligence__  
##   Ability EI as a factor of intelligence. **Ability EI is a collection of cognitive abilities relating to the recognition, understanding and management of emotions. There have been many controversies in attempting to contextualise Ability EI within models of intelligence/cognitive ability. MacCann et al. (2014) empirically tested multiple models of how various cognitive abilities interact, including hierarchical and bi-factor models, and the data demonstrated closest fit to a hierarchical structure where Ability EI was contextualised as a second-stratum factor. A recent replication repeated this modelling process and drew the same conclusion
## 
## - __Matilda effect__  
##   Matthew Matilda effect)**.** Male scientists and masculine topics are frequently perceived as demonstrating higher scientific quality
## 
## - __Being slightly behind increases chance of winning__  
##   Being slightly behind increases the chance of winning.** The original study has found that being slightly behind at halftime increases the chance of winning significantly in professional Basketball.​
## 
## - __Ethnoracial diversity and trust__  
##   Ethnoracial diversity negatively affects trust and social capital
## 
## - __Greed moderates relationship between SES and unethical behaviour__  
##   Greed moderates the relationship between SES and unethical behaviour.** The original study found that people of higher socio-economic status are more likely to engage in unethical behaviour, but that this relationship is moderated by greed. When study participants were primed to think positively about greed, those of lower SES became more likely to engage in unethical behaviour than those of higher SES
## 
## - __Women’s education increasing domestic violence__  
##   Women’s education increases domestic violence.** Women with more education report higher levels of psychological violence at home​
## 
## - __Easterlin paradox__  
##   national income associated with happiness). When comparing across countries, higher levels of income are associated with higher levels of subjective well-being, yet this association does not show up across time
## 
## - __Humour style clusters__  
##   A number of works have attempted to determine whether individuals can be categorised into different types of humour user. The first was by Galloway (2010) and suggested four types of humour user through use of cluster analysis: (1) above average on all of the styles, or (2) below average on all of the styles, or (3) above average on the positive styles (Affiliative and Self-enhancing), and below average on the negative styles (Aggressive and Self-defeating), or (4) above average on the negative styles and below average on the positive styles
## 
## - __Social referencing effect__  
##   Crosby et al. (2008) found that hearing an offensive remark caused subjects to look longer at a potentially offended person, but only if that person could hear the remark. On the basis of this result, they argued that people use social referencing to assess the offensiveness
## 
## - __Other-race effect__  
##   cross-race effect, own-race bias). Humans are better at distinguishing between faces of two individuals of their own race than two faces of another race
## 
## - __Unethical amnesia__  
##   Memories of unethical behaviour are less clear and vivid than memories of good deeds.​​
## 
## - __Feeling dirty after networking__  
##   People feel uncomfortable networking because networking triggers a state of “moral impurity,” which translates into feelings of “dirtiness” and a heightened desire for “cleansing”
## 
## - __Public exposure influences shame/guilt differently__  
##   Public exposure influences shame and guilt differently. **Public exposure (implicit and explicit) of transgression increases experienced shame more than guilt
## 
## - __Drunk utilitarian__  
##   People are more likely to accept harm for the greater good when they are under the influence of alcohol
## 
## - __Beauty is good stereotype in autistic individuals__  
##   Autistic individuals judge faces on beauty as well as neurotypical individuals
## 
## - __Cognitive ability and prejudice__  
##   Lower cognitive ability is associated with higher prejudice towards minority groups.​
## 
## - __Reading and theory of mind__  
##   Reading fiction improves social cognition, i.e. understanding of others’ cognitive and emotional states. ​
## 
## - __Morning morality effect__  
##   Normal, unremarkable experiences associated with everyday living can deplete one’s capacity to resist moral temptations. People were more likely to lie and cheat in the afternoon than in the morning.​
## 
## - __Sexist attitudes and facial hair__  
##   Men with facial hair are significantly higher in hostile sexism than clean-shaven men.​ Since facial hair is highly sexually dimorphic and associated with traits of male social dominance, men who are more favourable to gender differentiation and role segregation in society may be drawn toward cultivating a bearded appearance
## 
## - __Analytical thinking and belief in conspiracy theories__  
##   Priming analytical thinking through a verbal fluency task (i.e., scrambled sentence task) or a processing fluency manipulation (i.e., difficult-to-read fonts) reduces belief in conspiracy theories.​
## 
## - __Preferences for uniqueness and conformity__  
##   There are pronounced cross-cultural differences in the extent to which people opt for originality or make majority-based choices.​ European Americans preferred objects that are different from others (such as pen with an uncommon vs. common colour), whereas East Asians preferred objects that are the same as others (such as pen with common colour
## 
## - __Pratfall effect__  
##   Kennedy and Nixon effect). While average ability people who commit blunder or pratfall are less liked than average ability people who don’t commit it, but the reverse is true for very competent people. The authors argue that it is because the pratfall humanises the competent people, who then seem more approachable
## 
## 
## **Speech Language Therapy**
## 
## - __Stuttering and bilingualism__  
##   Bilingual children had an increased risk of stuttering and a lower chance of recovery from stuttering than language exclusive and monolingual speakers
## 
## - __Stuttering and self-esteem__  
##   Children who stutter have higher self-esteem than children who do not stutter. However, the self-esteem of children who stutter declines once they reach adolescence
## 
## - __Stuttering and dyslexia co-occurrence__  
##   People who stutter show high co-occurrence with dyslexia than neurotypical adults
## 
## - __Stuttering and phonological working memory impairment__  
##   Adults who stutter show lower scores on phonological working memory, using a nonword repetition task
## 
## - __Stuttering and phonological monitoring impairment__  
##   Adults who stutter show lower scores on phonological monitoring than neurotypical adults
## 
## - __Stuttering and phonological awareness impairment (vs. neurotypicals)__  
##   Adults who stutter show lower scores on phonological awareness than neurotypical adults
## 
## - __Stuttering and phonological awareness impairment (vs. dyslexia)__  
##   Adults who stutter show similar scores on phonological awareness to dyslexic adults
## 
## - __Stuttering and reading fluency impairment (vs. dyslexia)__  
##   Adults who stutter show similar scores on reading fluency to dyslexic adults
## 
## - __Struggling readers and stuttering co-occurrence__  
##   Dyslexic adults show higher co-occurrence with stuttering than neurotypical adults. ​
```
