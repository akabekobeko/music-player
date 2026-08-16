-- Nullify invalid release years imported before the mapping validated them.
-- Some files carry junk year tags (e.g. ID3 TYE = "-1"); year <= 0 can never
-- be a real release year, so treat it as unknown (NULL).
-- Applied files must never change; schema changes go into new numbered files.

UPDATE musics SET year = NULL WHERE year <= 0;
