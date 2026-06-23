# Gao, J., Guo, Y., Lim, G., Zhang, T., Zhang, Z., Li, T. J.-J., & Perrault, S. T. (2024). CollabCoder: A lower-barrier, rigorous workflow for inductive collaborative qualitative analysis with large language models. Proceedings of the 2024 CHI Conference on Human Factors in Computing Systems.

## Metadata
Citation_Key: gao2024
Year: 2024
Zotero_Item_Key: SQRTYAKB
Source_Type: conference_paper
Peer_Review: peer_reviewed
Evidence_Type: instrument_or_framework_development
Primary_Methodology: participatory_design
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
Gao et al. present CollabCoder, a human-computer collaboration system designed to lower barriers to rigorous Collaborative Qualitative Analysis (CQA) while integrating large language models (LLMs) throughout the workflow. The paper addresses a long-standing challenge in qualitative research: CQA, which involves multiple coders independently analyzing the same data and then iteratively discussing results to reach consensus, enhances rigor but requires significant time, coordination, and expertise. The authors describe the design, implementation, and evaluation of a system that supports three key stages of CQA grounded in Grounded Theory and Thematic Analysis: independent open coding, iterative team discussion, and codebook development.

The CollabCoder system architecture emphasizes the balance between automation and human agency. In the independent open coding phase, coders work in private, isolated workspaces to prevent mutual influence. The system provides LLM-generated code suggestions drawn from analysis of peer codes and coding history, helping coders explore interpretive possibilities without constraining their initial coding choices. The system records this decision-making data for later collective review. In the discussion phase, the system switches to a shared workspace where teams access quantitative metrics identifying agreements and disagreements among coders, along with all previous coding decisions. Coders can trace why others made specific coding choices, promoting mutual understanding. LLMs function as mediators during this phase, helping teams resolve disagreements and consolidate codes. In the codebook development phase, the system suggests code groups derived from the final code decisions, using LLM-generated hierarchical groupings that coders can accept, modify, or reject.

The system was evaluated through a 16-user study where participants completed a qualitative analysis task (analyzing book review texts) in CollabCoder and compared it to Atlas.ti Web, a commercially available qualitative analysis platform. Results demonstrated several advantages for CollabCoder: users rated it higher on usability ("easy to use" and "learn to use quickly," 75%+ agreement), perceived it as better supporting independent coding while fostering team understanding, and found it more effective at code resolution—allowing pairs of codes to be discussed in a single dialogue rather than the multiple rounds required by Atlas.ti Web. Participants emphasized the value of the system displaying decision-making data and quantitative metrics for understanding team disagreement.

The authors stress the importance of humans-in-the-loop design throughout the workflow. While LLMs provide suggestions, human researchers remain responsible for evaluating, modifying, or rejecting AI-generated outputs. The design also incorporates explicit theoretical grounding in CQA best practices, translating six-step CQA protocols into system features that guide users toward consensus coding rather than the faster but less rigorous split-coding approach. The paper contributes design guidelines derived from theory, literature, platform analysis, and expert interviews, offering principles for future AI-assisted CQA systems.

The system prioritizes transparency about when and how LLMs intervene. In the open coding phase, LLMs function primarily as "suggestion providers" offering possibilities; in later phases, they transition to "mediator" and "facilitator" roles supporting team decision-making. This staged integration reflects the paper's argument that AI assistance should adapt to the specific needs and risks of each CQA stage.

## Productive Incongruences and Challenges

Like Katz et al. 2024, this article does not directly address games-based library services, nor does it examine games, play, library contexts, or library-specific applications. The research is situated in HCI and qualitative research methodology rather than library science or game studies. The article's value to GBLS lies entirely in research methods rather than practice or theory about games.

The potential relevance to GBLS research mirrors that of Katz et al.: CollabCoder could support library researchers conducting collaborative qualitative analysis of games-based program data. For instance, if multiple researchers were coding interview transcripts from patrons about their games-based library experiences, or analyzing open-ended survey responses about game programming, CollabCoder could help them maintain analytical rigor while managing the coordination burden of collaborative coding. The system's emphasis on preserving coder independence during initial coding while facilitating consensus-building in discussion phases aligns with qualitative research best practices.

However, the article includes no discussion of whether or how its methods apply to analyzing game-related phenomena, interview contexts involving games, or library-specific qualitative data. The evaluation used book review texts, demonstrating applicability to short textual data, but did not test the system on other data types or contexts.

## Suggested Review Contributions

**Target Section: Not Applicable**

This article does not contribute directly to the Games-Based Library Services review. Like Katz et al., it is a methodological contribution that could support future GBLS research involving large-scale qualitative analysis rather than a source discussing games, library services, or the outcomes and mechanics of games-based programming.

If future GBLS researchers adopt systems like CollabCoder for analyzing patron experiences, community feedback, or program outcomes, a secondary methodological note could acknowledge how human-centered AI systems can make rigorous qualitative analysis more accessible to library teams with limited resources or research experience. This would reinforce the review's emphasis on systematic, evidence-based assessment of GBLS outcomes.
