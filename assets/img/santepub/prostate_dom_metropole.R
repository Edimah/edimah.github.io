library(readr)
library(dplyr)
library(tidyr)
library(stringr)
library(ggplot2)
library(forcats)
library(knitr)

###############################
# DATA IMPORT AND PREPARATION #
###############################

# Importing data from CSV file (source: Global Cancer Observatory, 2022)

path <- here::here("public-health", "data", "dataset-inc-males-in-2022-prostate.csv")
prostate_incidence_2022 <- read_csv(path, show_col_types = FALSE)

# Preview the data
head(prostate_incidence_2022)
print(paste0("Columns: ", paste(colnames(prostate_incidence_2022), collapse = ", ")))


french_incidence <- prostate_incidence_2022 %>%
    # Isolate french incidence data
    filter(str_detect(Label, regex("(france|french)", ignore_case = TRUE))) %>%
    # Remove unnecessary columns
    select(-`Alpha-3 code`, -`Cancer code`, -`Population code (ISO/UN)`, -Country, -Sex) %>%
    # Remove duplicate column & rename leftover column for clarity
    rename(cases = Number...7) %>%
    select(-`Number...10`)


# Preview the filtered data
glimpse(french_incidence)

# Save the filtered data for further analysis
saveRDS(french_incidence, here::here("public-health", "data", "french_prostate_incidence_2022.rds"))
write_csv(french_incidence, here::here("public-health", "data", "french_prostate_incidence_2022.csv"))


############################################################
# PLOTTING CONTINENTAL AND OVERSEAS FRENCH INCIDENCE RATES #
############################################################

comparison <- french_incidence %>%
    mutate(
        region_type = if_else(
            Label == "France (metropolitan)",
            "Metropolitan France",
            "Overseas territories"
        ),
        label_en = case_when(
            Label == "France (metropolitan)" ~ "Metropolitan France",
            str_detect(Label, "^France,\\s*") ~ str_remove(Label, "^France,\\s*"),
            TRUE ~ Label
        )
    )

custom_theme <- theme_minimal(base_size = 14) +
    theme(
        panel.grid.major.y = element_blank(),
        panel.grid.minor = element_blank(),
        axis.text.x = element_text(angle = 45, hjust = 1, vjust = 1, color = "#333"),
        axis.text.y = element_text(color = "#333"),
        axis.title.y = element_text(margin = margin(r = 10)), # push label away from plot
        plot.title.position = "plot",
        plot.title = element_text(face = "bold", lineheight = 1.1),
        plot.subtitle = element_text(margin = margin(b = 10)),
        plot.caption = element_text(color = "#555", margin = margin(t = 12)),
        plot.margin = margin(t = 20, r = 20, b = 20, l = 30), # add top margin
        legend.position = "none"
    )


# English version
p_asr_en <- ggplot(
    comparison,
    aes(
        x = forcats::fct_reorder(label_en, `ASR (World)`), y = `ASR (World)`,
        fill = region_type
    )
) +
    geom_col(width = 0.7) +
    scale_fill_manual(values = c(
        "Metropolitan France" = "#b8b8b8",
        "Overseas territories" = "#045a8d"
    )) +
    labs(
        x = NULL,
        y = "ASR (World) per 100k",
        title = "Age-standardised rate (ASR) for prostate cancer incidence\nin continental and overseas France",
        subtitle = "Globocan 2022 age-standardised rates (per 100,000 population)",
        caption = "Source: IARC Globocan 2022"
    ) +
    custom_theme


# Saving english version
output_dir <- here::here("public-health", "exports")

ggsave(
    filename = file.path(output_dir, "prostate_incidence_france_overseas_en.png"),
    plot = p_asr_en,
    width = 8, height = 5, dpi = 320, bg = "white"
)
# Plotting French version
comparison_fr <- comparison %>%
    mutate(
        label_fr = case_when(
            Label == "France (metropolitan)" ~ "France métropolitaine",
            Label == "French Guyana" ~ "Guyane française",
            Label == "France, La Réunion" ~ "La Réunion",
            Label == "France, Guadeloupe" ~ "Guadeloupe",
            Label == "France, Martinique" ~ "Martinique",
            Label == "French Polynesia" ~ "Polynésie française",
            TRUE ~ Label
        )
    )

p_asr_fr <- ggplot(
    comparison_fr,
    aes(
        x = forcats::fct_reorder(label_fr, `ASR (World)`), y = `ASR (World)`,
        fill = region_type
    )
) +
    geom_col(width = 0.7) +
    scale_fill_manual(values = c(
        "Metropolitan France" = "#b8b8b8",
        "Overseas territories" = "#045a8d"
    )) +
    labs(
        x = NULL,
        y = "TSM",
        title = "Incidence standardisée du cancer de la prostate\nFrance métropolitaine et d'Outre-mer",
        subtitle = "Taux Standardisés Monde (TSM) Globocan 2022 (pour 100 000 habitants)",
        caption = "Graphe : Edimah SYNESIUS SONGO \nDonnées: IARC GLOBOCAN 2022"
    ) +
    custom_theme

ggsave(
    filename = file.path(output_dir, "prostate_incidence_france_overseas_fr.png"),
    plot = p_asr_fr,
    width = 8, height = 5, dpi = 320, bg = "white"
)


#########################################
# EXPORTING SUMMARY TABLES FOR THE BLOG #
#########################################

asm_table_en <- comparison %>%
    select(Region = label_en, `ASR (World)`) %>%
    arrange(desc(`ASR (World)`))

tsm_table_fr <- comparison_fr %>%
    select(`Région` = label_fr, `TSM (monde)` = `ASR (World)`) %>%
    arrange(desc(`TSM (monde)`))

write_csv(asm_table_en, file.path(output_dir, "prostate_asr_table_en.csv"))
write_csv(tsm_table_fr, file.path(output_dir, "prostate_tsm_table_fr.csv"))

asm_table_md <- kable(asm_table_en, format = "pipe", align = c("l", "r"))
tsm_table_md <- kable(tsm_table_fr, format = "pipe", align = c("l", "r"))

writeLines(asm_table_md, file.path(output_dir, "prostate_asr_table_en.md"))
writeLines(tsm_table_md, file.path(output_dir, "prostate_tsm_table_fr.md"))
