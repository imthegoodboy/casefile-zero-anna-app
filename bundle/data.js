export const DETECTIVES = [
  { id: "anika", name: "Anika Rao", title: "The Analyst", crop: "0%", gift: "timeline", giftLabel: "Timeline reconstruction" },
  { id: "malik", name: "Malik Stone", title: "The Observer", crop: "-25%", gift: "scene", giftLabel: "One extra scene pulse" },
  { id: "ren", name: "Ren Ito", title: "The Reader", crop: "-50%", gift: "behavior", giftLabel: "Behavioral tells" },
  { id: "evelyn", name: "Evelyn Frost", title: "The Examiner", crop: "-75%", gift: "forensics", giftLabel: "Expanded forensic notes" },
];

export const ACCENTS = [
  { id: "vermilion", name: "Vermilion", value: "#c6412d", effect: "A decisive red marks found evidence, active links, and moments that need your attention." },
  { id: "brass", name: "Old brass", value: "#b28a4f", effect: "A warm brass highlight pulls focus toward evidence notes, progress, and the case record." },
  { id: "sage", name: "Night sage", value: "#718070", effect: "A quiet green tint softens found markers and active states across the investigation." },
];

export const CAST = {
  reed: { id: "reed", name: "Alistair Reed", role: "Railway architect", crop: "0%", temperament: "Controlled", biography: "Designer of the terminal restoration. Precise, indebted, and protective of his reputation." },
  mara: { id: "mara", name: "Mara Voss", role: "Gallery curator", crop: "-25%", temperament: "Guarded", biography: "Curator of the Vale collection. Elegant under pressure and unusually careful with time." },
  eli: { id: "eli", name: "Eli Mercer", role: "Night porter", crop: "-50%", temperament: "Nervous", biography: "The terminal's longest-serving night porter. He knows every service corridor and every old lock." },
  vera: { id: "vera", name: "Vera Quinn", role: "Investigative journalist", crop: "-75%", temperament: "Defiant", biography: "A reporter chasing the Vale family's hidden dealings. She never arrives without a second question." },
};

const q = (label, answer, tell = "") => ({ label, answer, tell });

export const CASES = [
  {
    id: "last-departure",
    number: "01",
    title: "The Last Departure",
    subtitle: "A patron dies beneath a clock that insists he was already gone.",
    image: "./assets/terminal-crime-scene.webp",
    location: "Arden Terminal",
    time: "00:17 · Saturday",
    difficulty: "Initiate",
    estimated: "20–30 min",
    incident: "Suspicious death",
    coldOpen: "Rain seals Arden Terminal beneath a sheet of silver. At twelve seventeen, restoration patron Julian Cross is found beside the archive stairs. His final train never left the platform—and someone has moved the station clock by eleven minutes.",
    briefing: [
      "Cross funded the terminal's restoration and planned a private announcement at midnight. Four people remained inside after the public doors closed: the architect, the curator, the porter, and the journalist who had been following him for months.",
      "There are no signs of a struggle. An espresso cup rests near the body, a torn freight ledger is missing three pages, and a single red glove lies where the concourse meets the archive corridor. Every suspect agrees on one fact: Cross was alive at eleven forty-five. Everything after that fractures.",
      "Recover the timeline, identify how Cross was killed, and prove who needed the old freight records to stay buried. A hunch is not an accusation; bring the board with you.",
    ],
    objective: "Prove who killed Julian Cross, why the freight ledger mattered, and how the false departure time protected the culprit.",
    suspects: {
      reed: {
        alibi: "I called Julian from the drafting room at eleven forty-seven. He sounded irritated, but alive. I left by the east doors before midnight.",
        questions: [
          q("Where were you at midnight?", "In the drafting room until my call with Julian ended, then the east arcade. My access card should show it.", "He answers with exact locations, but never gives the time he crossed the arcade."),
          q("Why did Cross call you?", "He wanted changes to the archive ventilation hidden before tomorrow's inspection. I refused. That disagreement was professional."),
          q("Recognize the brass key?", "Archive master. Eli signs it out; Mara sometimes borrows it for collection records."),
          q("What was Cross afraid of?", "Exposure. Not death—humiliation. The restoration money moved through too many private accounts."),
        ],
      },
      mara: {
        alibi: "I boarded the 11:40 northbound and was home before midnight. That red glove resembles mine, but I lost the pair weeks ago.",
        questions: [
          q("Show me your ticket.", "There. Car two. The conductor punched it before departure, as always.", "She covers the punch mark with her thumb before handing it over."),
          q("Why were you in the archive?", "I was not. Julian and I reviewed the collection ledger in the gallery earlier that evening."),
          q("Recognize the red glove?", "Mine was Italian leather, not whatever was found in that filthy concourse. I lost it last month."),
          q("What did Cross plan to announce?", "A new acquisition. He enjoyed suspense. I was not invited into his confidence."),
        ],
      },
      eli: {
        alibi: "I reset the platform lamps during the planned camera outage. At 12:03 I heard a cup break and found Mr Cross by the stairs.",
        questions: [
          q("Why were the cameras dark?", "Electrical inspection. Logged three days ago. Mr Reed signed it; the outage ran 11:32 to 11:55."),
          q("Who used the archive key?", "Ms Voss signed it out at ten twenty. She returned the hook, not the key. Said she'd slipped it under my desk."),
          q("What did you hear?", "A woman arguing at eleven fifty-something. Then the arrival bell, although no train was due."),
          q("Did you touch the clock?", "Only after I found him. It read 12:14, but my pocket watch said 12:03. Someone had pushed it ahead."),
        ],
      },
      vera: {
        alibi: "I was under the west canopy recording the rain and Cross's announcement. My recorder ran continuously from 11:50.",
        questions: [
          q("Why follow Cross?", "Because his charity shipped paintings in crates labeled as boiler parts. He promised me the ledger tonight."),
          q("What is on your recording?", "Rain, the false arrival bell, Mara telling someone 'those pages end here,' then Eli shouting for help."),
          q("Did you enter the archive?", "Not tonight. Cross would not risk being seen with me before the announcement."),
          q("Who benefits from the missing pages?", "The person who authenticated the paintings: Mara. But benefit is not proof."),
        ],
      },
    },
    clues: [
      { id: "glove", marker: "A", label: "Red leather glove", hotspot: { x: 41, y: 84 }, foundAt: "Concourse", short: "Rain-soaked, recently dropped.", detail: "A single red glove lies inside the rain line. Its inner seam holds black-blue pigment and a pale paper fiber.", forensic: "Pigment matches the archive ledger ink; the paper fiber matches pre-war freight forms." },
      { id: "cup", marker: "B", label: "Espresso cup", hotspot: { x: 19, y: 58 }, foundAt: "Ticket counter", short: "Bitter residue beneath anise.", detail: "The cup carries Cross's print and a blurred second print. A sweet anise scent masks a medicinal bitterness.", forensic: "Residue contains aconite tincture; the gallery conservatory cabinet records a missing vial." },
      { id: "ticket", marker: "C", label: "Punched ticket", hotspot: { x: 73, y: 64 }, foundAt: "Platform two", short: "Punch time contradicts the alibi.", detail: "Mara's northbound ticket was punched at 11:58. The train departed at 12:05, not 11:40.", forensic: "The punch wheel date and conductor initials are authentic." },
      { id: "ledger", marker: "D", label: "Torn freight ledger", hotspot: { x: 52, y: 47 }, foundAt: "Archive stairs", short: "Three shipment pages removed.", detail: "The remaining entries route paintings through shell charities. Fresh fibers show the pages were torn tonight.", forensic: "A partial thumbprint in vermilion conservation wax belongs to Mara." },
      { id: "clock", marker: "E", label: "Clock service log", hotspot: { x: 46, y: 19 }, foundAt: "Main clock", short: "Mechanism advanced eleven minutes.", detail: "The clock casing was opened with an archive key. Tool marks are fresh; its hands were manually advanced.", forensic: "Brass grease on the key matches the clock's service gear." },
      { id: "recording", marker: "F", label: "Canopy recording", hotspot: { x: 86, y: 52 }, foundAt: "West canopy", short: "A phrase beneath the false bell.", detail: "At 11:56 a woman's voice says, ‘Those pages end here.’ The false arrival bell follows thirty seconds later.", forensic: "Rain rhythm continues without a cut; the recording timestamp is reliable." },
    ],
    connections: [
      { ids: ["ticket", "clock"], title: "The manufactured departure", text: "Mara was still inside at 11:58. Advancing the clock made discovery appear later and supported her false 11:40 departure." },
      { ids: ["glove", "ledger"], title: "Archive contact", text: "Ledger ink and freight-form fibers inside the glove place its wearer at the freshly torn records." },
      { ids: ["cup", "ledger"], title: "Means meets motive", text: "The poisoned cup explains Cross's death; the ledger exposes why the curator needed him silent." },
      { ids: ["recording", "ticket"], title: "A voice before departure", text: "The recorded threat occurs before Mara's real punch time, destroying the alibi from two independent sources." },
    ],
    timeline: [
      { time: "22:20", text: "Mara signs out the archive key." },
      { time: "23:32", text: "Planned camera outage begins." },
      { time: "23:47", text: "Reed speaks with Cross by telephone." },
      { time: "23:56", text: "Vera records the threat and false bell." },
      { time: "23:58", text: "Mara's northbound ticket is punched." },
      { time: "00:03", text: "Eli discovers Cross; station clock shows 00:14." },
    ],
    motives: ["Hide a forged-art shipping scheme", "Take control of the restoration contract", "Protect an anonymous source", "Revenge for a dismissed employee"],
    methods: ["Aconite hidden in espresso", "A staged fall on the archive stairs", "A blow from the clock key", "An electrical fault during the outage"],
    solution: { culprit: "mara", motive: "Hide a forged-art shipping scheme", method: "Aconite hidden in espresso", evidence: ["glove", "cup", "ticket", "ledger", "clock", "recording"], explanation: "Mara Voss learned that Cross would expose the forged shipments. She dosed his espresso with aconite, tore out the ledger pages, advanced the station clock, and planned to leave on the 12:05 while claiming the earlier train. The wet glove, punch time, recording, and wax print reconstruct the deception." },
  },
  {
    id: "glass-cipher",
    number: "02",
    title: "The Glass Cipher",
    subtitle: "A priceless lens vanishes from a room that never opened.",
    image: "./assets/museum-annex.webp",
    location: "Halcyon Museum Annex",
    time: "02:04 · Thursday",
    difficulty: "Skilled",
    estimated: "25–35 min",
    incident: "Locked-room theft",
    coldOpen: "The Halcyon Lens disappears during a ninety-second blackout. Its glass case remains sealed, the skylight alarm never sounds, and every door log insists the annex was empty. Yet fine brass dust circles a floor vent no curator remembers approving.",
    briefing: [
      "The lens is the centerpiece of tomorrow's reopening gala: a precision optic recovered from Arden Terminal's first survey train. Insurance values it at four million, but its etched rim may be worth more to someone searching for a forgotten tunnel.",
      "Reed designed the display, Mara catalogued the object, Eli supervised the overnight move, and Vera published its disputed history. Each knew the blackout drill. Only one understood that the display's pressure sensor could be reached without opening the glass.",
      "Find the route through the locked room, establish who engineered the blackout, and recover the motive hidden inside the lens itself.",
    ],
    objective: "Identify the thief, explain the impossible display breach, and prove which evidence links the service route to the suspect.",
    suspects: {
      reed: {
        alibi: "I watched the blackout drill from the hotel lobby across the street. The annex was sealed exactly as I designed it.",
        questions: [q("How is the case protected?", "Pressure plate, magnetic seal, and independent battery. No one opens it in darkness.", "He explains the case, but not the maintenance conduit beneath it."), q("Why is your blueprint here?", "Every service drawing carries my stamp. A discarded copy proves nothing."), q("Know the floor vent?", "An obsolete heating return. It does not connect to the display."), q("Why insure the lens twice?", "The board insisted. Restoration funding is fragile; redundancy is prudent.")],
      },
      mara: {
        alibi: "I inventoried the east gallery with two interns until 2:10. The lens was sealed when I left the annex at midnight.",
        questions: [q("What is etched on the lens?", "Coordinates, perhaps. Reed dismissed them as calibration marks."), q("Who handled it last?", "I did, under camera, then Eli rolled the case into position."), q("Could the glass be swapped?", "Not without changing its weight. The empty mount weighs exactly what it should—too exactly."), q("Who knew the blackout?", "Staff and contractors. Reed chose the ninety-second duration.")],
      },
      eli: {
        alibi: "I was in the generator room. When the relay tripped early, I restored power by hand.",
        questions: [q("Who accessed the service tunnel?", "Mr Reed inspected it last week. Said he was checking damp under the new floor."), q("Why is brass dust present?", "Fresh cutting, I'd say. Old ducts leave rust, not brass."), q("Was the case moved?", "Half an inch clockwise. The wheel locks were still down."), q("Did the relay fail?", "No. A timer bridged the contacts. Someone wanted an exact window.")],
      },
      vera: {
        alibi: "I was live on the midnight radio programme. There is a studio recording and six other guests.",
        questions: [q("Why research the lens?", "Its etched coordinates point beneath the old station. Someone buried a private vault there."), q("Who needs those coordinates?", "Anyone drowning in restoration debt—and Reed is drowning."), q("Did you publish the tunnel?", "Not yet. Cross asked me to wait until he verified it."), q("Could your source steal it?", "My source gave me a photograph. They never touched the object.")],
      },
    },
    clues: [
      { id: "blueprint", marker: "A", label: "Revised blueprint", hotspot: { x: 72, y: 85 }, foundAt: "Floor vent", short: "A conduit omitted from the filed plan.", detail: "A rolled revision shows a narrow maintenance sleeve from the service tunnel to the display pedestal.", forensic: "The revision printer code belongs to Reed's private drafting machine." },
      { id: "dust", marker: "B", label: "Brass filings", hotspot: { x: 62, y: 83 }, foundAt: "Vent grille", short: "Fresh-cut metal around one screw.", detail: "Fine brass dust forms a crescent where the grille was removed and replaced.", forensic: "Alloy matches a custom hollow display bolt, not the historic ventilation system." },
      { id: "relay", marker: "C", label: "Relay timer", hotspot: { x: 16, y: 57 }, foundAt: "Generator cabinet", short: "A precise ninety-second bridge.", detail: "A pocket timer forced the lights and display telemetry offline without interrupting the physical seal.", forensic: "The solder pattern matches repairs documented in Reed's workshop invoices." },
      { id: "weight", marker: "D", label: "Counterweight cylinder", hotspot: { x: 49, y: 53 }, foundAt: "Display plinth", short: "The case was fooled, not opened.", detail: "A brass cylinder inside the mount replaced the lens gram for gram while it was lowered through the pedestal.", forensic: "Machining oil contains cedar resin used in Reed's model shop." },
      { id: "debt", marker: "E", label: "Private debt notice", hotspot: { x: 89, y: 41 }, foundAt: "Archive desk", short: "Payment due before the gala.", detail: "A lender offers to cancel Reed's debt in exchange for ‘the optic and its route.’", forensic: "Indentations on the envelope match notes in Reed's appointment book." },
      { id: "photograph", marker: "F", label: "Tunnel photograph", hotspot: { x: 31, y: 48 }, foundAt: "Map table", short: "A matching circular lock underground.", detail: "Vera's photograph shows a vault dial with the same divisions etched around the lens rim.", forensic: "Metadata predates the theft by three weeks and places the site below Arden Terminal." },
    ],
    connections: [
      { ids: ["blueprint", "dust"], title: "The hidden route", text: "The omitted conduit and freshly cut grille reveal a path beneath the sealed display." },
      { ids: ["relay", "weight"], title: "Ninety seconds of false certainty", text: "The timer blinded telemetry while a matched counterweight kept the pressure alarm satisfied." },
      { ids: ["debt", "photograph"], title: "Value beyond the glass", text: "The lender wanted the lens because its markings unlock the buried vault—not merely for its market value." },
      { ids: ["blueprint", "weight"], title: "Architect of the impossible", text: "Only the designer controlled both the unfiled service route and the exact pedestal geometry." },
    ],
    timeline: [{ time: "23:10", text: "Reed leaves the annex after a final ‘inspection.’" }, { time: "00:00", text: "Mara seals and inventories the lens." }, { time: "01:48", text: "A timer is clipped across the generator relay." }, { time: "02:00", text: "Blackout begins ninety seconds early." }, { time: "02:02", text: "Power returns; telemetry reports an untouched case." }, { time: "02:04", text: "Mara notices the lens is gone." }],
    motives: ["Erase a family scandal", "Trade the lens to settle a private debt", "Expose the museum's false provenance", "Recover a sentimental heirloom"],
    methods: ["Cut through the skylight", "Swap the entire glass case", "Use a hidden conduit and matched counterweight", "Bribe the night porter"],
    solution: { culprit: "reed", motive: "Trade the lens to settle a private debt", method: "Use a hidden conduit and matched counterweight", evidence: ["blueprint", "dust", "relay", "weight", "debt"], explanation: "Alistair Reed designed an unfiled sleeve beneath the display. His timer blinded telemetry for ninety seconds while he lowered the lens and raised a machined counterweight through a hollow bolt. The lender's note explains why he risked everything: the lens was payment for his debt and a key to the buried vault." },
  },
  {
    id: "black-sun",
    number: "03",
    title: "Black Sun at 2:13",
    subtitle: "A broken sky, a burned message, and an impossible photograph.",
    image: "./assets/observatory.webp",
    location: "Orison Hotel Observatory",
    time: "02:13 · Eclipse night",
    difficulty: "Expert",
    estimated: "30–40 min",
    incident: "Attempted framing",
    coldOpen: "At exactly 2:13, the Orison observatory dome fractures from within. Astronomer Leona Saye survives, locked unconscious in the chart room. On the telescope plate is a photograph of a star that does not exist—and in the ashes of a telegram, your own codename.",
    briefing: [
      "Saye had spent a decade decoding the Black Sun plates, a series of survey photographs rumored to hide financial transfers inside stellar coordinates. Tonight she meant to reveal the final cipher to a room of four invited witnesses.",
      "The storm canceled the presentation, but none of the witnesses left the hotel. Reed serviced the dome mechanism, Mara insured the plates, Eli delivered a locked equipment case, and Vera arranged the exclusive. Someone drugged Saye, staged a violent entry, and planted a message designed to pull you into the scandal.",
      "Determine who fabricated the impossible star, why the dome was broken from inside, and whose story depends on a photograph taken before the camera existed.",
    ],
    objective: "Unmask the person who staged the observatory attack and prove how the false plate and telegram were manufactured.",
    suspects: {
      reed: { alibi: "I remained in the mechanical floor below the dome. The fracture came from an overloaded rotation gear.", questions: [q("Could the dome break inward?", "Not from wind. A manual release could snap the inner brace, but only from this room."), q("Who requested maintenance?", "Vera. She said the eastern shutter spoiled her photographer's angle."), q("Recognize this metal shard?", "A shutter brace. Cut recently with a carbide wheel."), q("Did you see Saye?", "At one forty. Awake, furious, and holding a telegram.")] },
      mara: { alibi: "I was in the insurance suite inventorying the original plates on a live video call.", questions: [q("Why insure forged plates?", "We did not know they were forged. Saye refused spectroscopy until tonight."), q("Who knew the cipher?", "Saye and Vera. The journalist brought the translation sample."), q("What drug was used?", "The hotel doctor said a sedative from the press kit's sleep-aid samples."), q("Why is your seal on the case?", "Because I closed it at midnight. The seal is intact; the contents are not.")] },
      eli: { alibi: "I delivered the equipment case at 1:25, then returned to the terminal. Dispatch logged my van.", questions: [q("Was the case heavy?", "Too light for glass plates. Vera signed for it before I could question her."), q("Who had a dome key?", "Hotel staff, Reed, and the event organizer—Vera."), q("Notice the telegram?", "Only the burnt corner. The paper smelled like her newspaper's chemical darkroom."), q("What happened at 2:13?", "The hotel clock radio cut to static. Someone had tuned every set to the same frequency.")] },
      vera: { alibi: "I was dictating my column in suite 814. My editor heard the dome break over the telephone.", questions: [q("Why is my codename in the telegram?", "Saye feared the cipher would implicate your agency. I was protecting you by calling first.", "Her concern arrives before you reveal when the telegram was burned."), q("Who made the impossible plate?", "Saye. A desperate attempt to make old research valuable."), q("When was this photograph taken?", "Last winter, according to the sleeve."), q("Why request the shutter repair?", "My photographer needed an unobstructed eastern exposure. Standard press work.")] },
    },
    clues: [
      { id: "plate", marker: "A", label: "Impossible star plate", hotspot: { x: 82, y: 54 }, foundAt: "Telescope bench", short: "An image dated before its emulsion existed.", detail: "The sleeve claims last winter, but the plate uses a fast emulsion released only six weeks ago.", forensic: "Retouching dye matches the newspaper darkroom used by Vera's publication." },
      { id: "telegram", marker: "B", label: "Burned telegram", hotspot: { x: 69, y: 84 }, foundAt: "Chart floor", short: "Your codename survives the flame.", detail: "Only the incriminating phrase is unburned. The message was typed on a portable machine with a damaged lowercase e.", forensic: "Vera's field typewriter produces the same displaced character." },
      { id: "brace", marker: "C", label: "Cut dome brace", hotspot: { x: 63, y: 23 }, foundAt: "Eastern shutter", short: "Broken inward by a timed release.", detail: "The brace was weakened before the storm, then snapped by the observatory's manual rotation cycle.", forensic: "Carbide dust lies inside Vera's borrowed equipment case." },
      { id: "sedative", marker: "D", label: "Press-kit vial", hotspot: { x: 26, y: 68 }, foundAt: "Chart room", short: "One sleep-aid sample is empty.", detail: "Saye's tea contains the same fast sedative supplied in the press welcome kits.", forensic: "A partial print on the vial matches Vera's right index finger." },
      { id: "call", marker: "E", label: "Edited call recording", hotspot: { x: 13, y: 47 }, foundAt: "Hotel exchange", short: "The crash was played down the line.", detail: "Vera's editor heard a dome fracture, but its echo repeats exactly eighteen seconds later.", forensic: "Waveform repetition proves a recording was played during the call." },
      { id: "invoice", marker: "F", label: "Syndication contract", hotspot: { x: 44, y: 76 }, foundAt: "Equipment case", short: "A scandal worth more than a discovery.", detail: "Vera receives a large bonus only if the Black Sun story implicates the agency and runs before dawn.", forensic: "The contract was signed hours before the supposed attack." },
    ],
    connections: [{ ids: ["plate", "telegram"], title: "One darkroom, two fabrications", text: "The false plate dye and staged telegram both point to Vera's reporting equipment." }, { ids: ["brace", "call"], title: "A crash on cue", text: "A weakened brace and looped sound let Vera create an alibi around a prearranged mechanical break." }, { ids: ["sedative", "invoice"], title: "Silence before deadline", text: "The press-kit sedative removed Saye while the contract rewarded a scandal published before she could contradict it." }, { ids: ["plate", "invoice"], title: "The impossible exclusive", text: "The photograph's false date made the story explosive; the contract proves it was planned before the event." }],
    timeline: [{ time: "00:00", text: "Mara seals the original Black Sun plates." }, { time: "01:25", text: "Eli delivers Vera's light equipment case." }, { time: "01:40", text: "Reed sees Saye awake with a telegram." }, { time: "01:52", text: "Saye drinks sedative-laced tea." }, { time: "02:12", text: "Vera calls her editor and plays the recorded crash." }, { time: "02:13", text: "The weakened eastern brace snaps during rotation." }],
    motives: ["Steal a hotel inheritance", "Protect the telescope patent", "Manufacture an exclusive scandal before deadline", "Destroy evidence of an affair"],
    methods: ["Break in through the skylight", "Stage the crash with a weakened brace and drugged witness", "Trigger lightning through the telescope", "Bribe the hotel electrician"],
    solution: { culprit: "vera", motive: "Manufacture an exclusive scandal before deadline", method: "Stage the crash with a weakened brace and drugged witness", evidence: ["plate", "telegram", "brace", "sedative", "call", "invoice"], explanation: "Vera fabricated a star plate in her newspaper darkroom, typed the incriminating telegram, sedated Saye, and weakened the dome brace. She played a recorded crash during her call, then let the rotation cycle create the real fracture. Her contract reveals the deadline that made the staged scandal valuable." },
  },
  {
    id: "silent-carriage",
    number: "04",
    title: "The Silent Carriage",
    subtitle: "A stopped train. A sealed case. Four minutes erased from sound.",
    image: "./assets/sleeper-carriage.webp",
    location: "Aurelian Night Express",
    time: "03:31 · Mountain tunnel",
    difficulty: "Master",
    estimated: "30–45 min",
    incident: "Diplomatic disappearance",
    coldOpen: "The Aurelian Night Express stops inside Bellweather Tunnel without command. When emergency lamps return, a diplomatic case is still chained beneath table seven—but the treaty inside has vanished. Every passenger remembers music. The phonograph record proves there were four minutes of perfect silence.",
    briefing: [
      "The treaty was traveling under a false menu cover until a border signing at dawn. Its courier, Ambassador Sorn, is unharmed but remembers a champagne toast followed by darkness. No exterior door opened, and the chain beneath table seven remains uncut.",
      "Reed inspected the tunnel signal system, Mara hosted the private dinner, Eli served the carriage, and Vera knew the treaty's real destination. A second train passed in the adjacent maintenance bore during the blackout, close enough to exchange more than a signal.",
      "Reconstruct the missing four minutes, distinguish the real case from its twin, and identify who turned ordinary dining-car service into a moving theft.",
    ],
    objective: "Find who removed the treaty, how the chained case stayed apparently sealed, and what the silent interval concealed.",
    suspects: {
      reed: { alibi: "I was in the locomotive cab when the tunnel signal turned red. Three crew members saw me.", questions: [q("Could the signal be forced?", "From the service bore, yes. But the railway logs every override."), q("Why did another train pass?", "Maintenance trolley. Unscheduled and running dark."), q("Know the case lock?", "A mirrored ward. Clever, but vulnerable to a casting key."), q("Who had the carriage plan?", "Eli. Service staff train with it.")] },
      mara: { alibi: "I was seated beside the ambassador throughout the blackout. I never left the table.", questions: [q("Who arranged the toast?", "Eli poured it. I selected the vintage, nothing more."), q("Why two menu covers?", "One concealed the treaty; the second was a decoy known only to the courier."), q("What did you hear in silence?", "A trolley wheel and a chain settling under our table."), q("Recognize the wax seal?", "A museum conservation wax—not diplomatic stock.")] },
      eli: { alibi: "I secured the galley when the brakes engaged. The steward can confirm I entered; he cannot confirm when I left.", questions: [q("Why did the music stop?", "The phonograph spring jammed when the brakes hit."), q("Who poured the champagne?", "I did. The ambassador's glass came from a sealed tray."), q("Why is your cuff frosted?", "Tunnel air through the broken window, I suppose.", "The dining windows are intact; only the inter-car transfer hatch is cold."), q("Can you open the case?", "No. I carry service keys, not diplomatic ones.")] },
      vera: { alibi: "I was in carriage four transmitting notes. The radio operator logged every word.", questions: [q("How did you know the route?", "A source in the ministry. The treaty matters; stealing it would destroy the talks."), q("What happened in four minutes?", "The thief used the passing trolley. Nothing else explains the frost."), q("Who knew the false cover?", "The ambassador, Mara, and me. Eli learned when he cleared the table."), q("Why is the record cracked?", "Someone stopped it by hand, then broke it to sell a story about the brakes.")] },
    },
    clues: [
      { id: "record", marker: "A", label: "Cracked phonograph record", hotspot: { x: 76, y: 86 }, foundAt: "Dining aisle", short: "Stopped by hand before the brakes.", detail: "The needle scratch begins four minutes before the emergency brake timestamp.", forensic: "Grease in the groove matches Eli's service-cart brake lubricant." },
      { id: "frost", marker: "B", label: "Frosted cuff thread", hotspot: { x: 8, y: 43 }, foundAt: "Transfer hatch", short: "Cold tunnel fibers on a warm carriage.", detail: "A navy wool thread is frozen into the transfer hatch seal.", forensic: "The weave and gold filament match Eli's porter uniform cuff." },
      { id: "case", marker: "C", label: "Twin diplomatic case", hotspot: { x: 79, y: 72 }, foundAt: "Table seven", short: "The chain is real; the case is not.", detail: "The chained case uses museum wax and weighs 1.8 kilograms less than the courier's receipt states.", forensic: "Its foam insert was cut with a conservation knife from Mara's event kit, accessible in the galley." },
      { id: "key", marker: "D", label: "Sugar casting key", hotspot: { x: 31, y: 67 }, foundAt: "Dessert trolley", short: "A dissolving copy of the mirrored ward.", detail: "A hard-sugar impression shaped like the diplomatic lock was hidden beneath a dessert mold.", forensic: "Fine brass transfer proves it was pressed against the real key during service." },
      { id: "override", marker: "E", label: "Tunnel override strip", hotspot: { x: 4, y: 29 }, foundAt: "Signal cabinet", short: "A service code stops both trains.", detail: "The override uses an employee meal-order number instead of a railway credential.", forensic: "The number belongs to Eli's staff account and was entered from the dining carriage terminal." },
      { id: "cart", marker: "F", label: "Maintenance trolley manifest", hotspot: { x: 54, y: 46 }, foundAt: "Radio desk", short: "One unlisted parcel gained weight.", detail: "The passing trolley left the tunnel with a sealed linen parcel 1.8 kilograms heavier than arrival.", forensic: "The parcel tag bears the dining carriage laundry code." },
    ],
    connections: [{ ids: ["record", "override"], title: "Silence before the stop", text: "The music was stopped deliberately while Eli's service number triggered the signal override four minutes later." }, { ids: ["frost", "cart"], title: "Across the moving gap", text: "Uniform fiber at the icy hatch and the heavier trolley parcel trace the treaty's exit route." }, { ids: ["case", "key"], title: "The chained decoy", text: "A sugar casting key opened the original before a lighter twin was attached to the untouched chain." }, { ids: ["override", "cart"], title: "A scheduled collision", text: "The same stop aligned the dining carriage with an unlisted trolley waiting in the maintenance bore." }],
    timeline: [{ time: "03:18", text: "Eli clears the table and handles the treaty cover." }, { time: "03:23", text: "The phonograph is stopped by hand." }, { time: "03:24", text: "A sugar key opens the original case in the galley." }, { time: "03:27", text: "Eli's service number triggers the tunnel signal." }, { time: "03:28", text: "The dark maintenance trolley aligns beside the transfer hatch." }, { time: "03:31", text: "Emergency lamps return; the chained twin remains." }],
    motives: ["Sell the treaty to a foreign broker", "Prevent the border agreement", "Expose the ambassador's secret route", "Recover a stolen family document"],
    methods: ["Cut the chain during the blackout", "Exchange the carriage at the station", "Use a sugar key, decoy case, and passing maintenance trolley", "Hide the treaty inside the phonograph"],
    solution: { culprit: "eli", motive: "Sell the treaty to a foreign broker", method: "Use a sugar key, decoy case, and passing maintenance trolley", evidence: ["record", "frost", "case", "key", "override", "cart"], explanation: "Eli copied the lock in sugar while serving dessert, stopped the music to mask his movements, opened the case in the galley, and chained a lighter museum-made twin beneath the table. His service code stopped the train beside a waiting trolley, where the treaty left in a weighted laundry parcel." },
  },
];

export function getCase(caseId) {
  return CASES.find((item) => item.id === caseId) || CASES[0];
}

export function getSuspect(caseFile, suspectId) {
  const base = CAST[suspectId];
  const caseDetails = caseFile?.suspects?.[suspectId];
  return base && caseDetails ? { ...base, ...caseDetails } : null;
}
