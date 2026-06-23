# Katz, A., Gerhardt, M., & Soledad, M. (2024). Using generative text models to create qualitative codebooks for student evaluations of teaching. International Journal of Qualitative Methods, 23, 16094069241293283.

## Metadata
Citation_Key: katz2024
Year: 2024
Zotero_Item_Key: SERKPH4I
Source_Type: peer_reviewed_journal_article
Peer_Review: peer_reviewed
Evidence_Type: instrument_or_framework_development
Primary_Methodology: theoretical_or_conceptual
Library_Context: non_library_context
Game_Format: unspecified_game_format
Service_Area: not_applicable
Audience: not_applicable
Intended_Outcome: not_applicable
Evidence_Confidence: not_applicable
Service_Conditions_Addressed: not_applicable
Conceptual_Theme: not_identified
Coding_Confidence: high

## Summary
Katz, Gerhardt, and Soledad present a novel computational workflow for automating inductive qualitative thematic analysis of large text datasets using large language models (LLMs) and natural language processing (NLP) techniques. The article is situated in engineering education research and addresses a practical problem: when institutions collect thousands of student evaluations of teaching (SETs), the volume of qualitative feedback becomes difficult for instructors and administrators to analyze meaningfully.

The authors develop an Extract, Embed, Cluster, and Summarize (EECS) workflow that processes qualitative text through four sequential computational stages. In the extraction phase, a fine-tuned generative model (dolphin-Mistral7b) reads each student comment and extracts discrete ideas, standardizing varied language. For example, a student comment "She did examples and explained how problems were done" is extracted as two separate ideas: "Provided examples" and "Explained problem-solving process." The embedding phase represents extracted ideas as vectors in a high-dimensional space using a pre-trained UAE-Angle model, enabling semantic comparison. The clustering phase uses HDBSCAN to group semantically similar ideas and identify a representative from each cluster. The final summarization phase passes cluster representatives to a generative model with instructions to add new codes to a developing codebook, using retrieval-augmented generation (RAG) to avoid redundancy and build coherence.

The authors validate their method against a manually-coded subset of the same dataset. A prior study had manually coded 39 themes from a sample of SETs using the Academic Plan Model (APM), a framework for categorizing learning-environment elements. The EECS workflow, applied to a corpus of 4,672 unique SETs, generated 75 usable codes (from an initial 80) that mapped onto the same APM framework, with substantial concordance in the faculty characteristics, instructional processes, and instructional resources categories. Notably, the automated method identified more granular codes than manual coding (e.g., distinguishing "clarification" from "simplification") and discovered a new category (Content and Sequence) not found in the original manual analysis. This suggests the method can scale to large datasets and identify subtleties that smaller manual samples miss.

The article emphasizes that while the EECS workflow is largely automated, human judgment remains essential. Researchers must identify and discard ambiguous codes, verify relevance to research questions, assess code granularity, determine saturation points, and customize prompts for different contexts. The authors advocate for "humans-in-the-loop" design, positioning the computational method as a tool that augments rather than replaces human analysis.

The workflow is designed for open-source, locally-deployable models to protect data privacy—a deliberate choice to avoid proprietary services like OpenAI or Google that may use user data for training. The authors suggest the method could transfer to other qualitative datasets beyond SETs, including student essays, interview transcripts, and administrative records, though they note this remains an open question.

## Productive Incongruences and Challenges

This article does not address games-based library services. It is a computer science and educational technology contribution focused on computational methods for qualitative analysis in education research. The inclusion of this article in the GBLS Zotero library appears to reflect interest in computational and AI-assisted methods for analyzing qualitative research data, which could potentially support future GBLS research.

However, the article provides no discussion of games, play, library contexts, or library services. It does not examine how the EECS workflow might be applied to game-related research, nor does it address pedagogical or experiential questions relevant to games-based education. The research is domain-agnostic by design: the same workflow could be applied to any large corpus of text requiring thematic analysis.

For GBLS specifically, the potential relevance lies in research methods rather than practice or theory. If library researchers were to conduct large-scale qualitative analyses of patron feedback about games-based programming, interviews with teen gamers, or open-ended survey responses about gaming experiences, the EECS workflow could offer a computationally-efficient method for generating codebooks. The article's emphasis on semantic similarity over word frequency may be particularly useful for analyzing diverse expressions of gaming experiences. The humans-in-the-loop framework also aligns with the GBLS review's emphasis on context-dependent, locally-informed practice.

## Suggested Review Contributions

**Target Section: Not Applicable**

This article does not contribute directly to the Games-Based Library Services review because it does not examine games, library contexts, or library-based services. However, it may be relevant as a methodological resource for future GBLS research involving large-scale qualitative data analysis. Researchers studying patron experiences, program outcomes, or community responses to games-based services could use the EECS workflow to efficiently generate thematic codebooks from interview transcripts, open-ended survey responses, or program feedback.

If future GBLS research incorporates this workflow, a secondary methodological contribution might be drawn emphasizing how computational tools can make qualitative analysis of local implementation data more feasible and rigorous, particularly for smaller institutions or under-resourced library programs that cannot hire multiple coders or afford expensive qualitative analysis software. This would support the review's broader call for better assessment and outcome evaluation in GBLS.
