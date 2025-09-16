# JB 2 Template

## PDF met Latex of Typst 

Om aan te geven welk type PDF je wilt bouwen, zet je dit in je `myst.yml` bestand onder `exports`.  
Bijvoorbeeld:

```yaml
exports:
  - format: pdf      # Voor LaTeX export
    output: exports/book.pdf
  - format: typst    # Voor Typst export
    output: exports/book.pdf
```

Ga naar Actions > klik op "Myst PDF Builder [LaTeX]" of "Myst PDF Builder [Typst]" > klik op "Run workflow" > klik op "Run workflow" in dropdown.

Een eventuele error voor de Typst action komt in de summary te staan. 
