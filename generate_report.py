import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

# Paths to visual evidence screenshots
IMG_WELCOME = r"C:\Users\ASUS\.gemini\antigravity\brain\7f9848bd-9d6e-419c-ad70-65ed76076cc7\.user_uploaded\media_1793432031273_929732ce.jpg"
IMG_LAB_CIRCUIT = r"C:\Users\ASUS\.gemini\antigravity\brain\7f9848bd-9d6e-419c-ad70-65ed76076cc7\.user_uploaded\media_1793432034448_aea4455d.jpg"
IMG_PLN_CALC = r"c:\Users\ASUS\Desktop\circuit\img_pln_calculator.png"
IMG_OUTDOOR_SOLAR = r"C:\Users\ASUS\.gemini\antigravity\brain\7f9848bd-9d6e-419c-ad70-65ed76076cc7\.user_uploaded\media_1793402835912_a61b2af3.jpg"
IMG_OUTDOOR_TOWER = r"C:\Users\ASUS\.gemini\antigravity\brain\7f9848bd-9d6e-419c-ad70-65ed76076cc7\.user_uploaded\media_1793405003649_795a1b85.jpg"

OUTPUT_DOCX_PRIMARY = r"c:\Users\ASUS\Desktop\circuit\Laporan_Inovasi_Circuit_Sandbox_SMPN12_Surabaya_Final.docx"


def set_cell_background(cell, fill_hex: str):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)


def set_cell_margins(cell, top=80, bottom=80, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)


def set_row_cant_split(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))


def add_section_banner(doc: Document, number_str: str, title_str: str, subtitle_str: str):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "0F172A")
    set_cell_margins(cell, top=90, bottom=90, left=150, right=150)
    set_row_cant_split(tbl.rows[0])

    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(1)
    r_num = p.add_run(f"BAGIAN {number_str}  |  ")
    r_num.bold = True
    r_num.font.name = "Calibri"
    r_num.font.size = Pt(10)
    r_num.font.color.rgb = RGBColor(0x38, 0xBD, 0xF8)

    r_title = p.add_run(title_str.upper())
    r_title.bold = True
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(11.5)
    r_title.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    p_sub = cell.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(0)
    r_sub = p_sub.add_run(subtitle_str)
    r_sub.italic = True
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(9)
    r_sub.font.color.rgb = RGBColor(0xCB, 0xD5, 0xE1)

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(3)


def add_bullet_point(doc: Document, bold_prefix: str, text_body: str):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(2.5)
    p.paragraph_format.line_spacing = 1.15
    r1 = p.add_run(bold_prefix)
    r1.bold = True
    r1.font.name = "Calibri"
    r1.font.size = Pt(10)
    r1.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    r2 = p.add_run(text_body)
    r2.font.name = "Calibri"
    r2.font.size = Pt(10)
    r2.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)


def build_report():
    doc = Document()

    # Clean standard margins allowing full editability in MS Word, WPS & Google Docs
    for section in doc.sections:
        section.top_margin = Inches(0.55)
        section.bottom_margin = Inches(0.55)
        section.left_margin = Inches(0.65)
        section.right_margin = Inches(0.65)

    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    # =========================================================================
    # HEADER UTAMA: LAPORAN INOVASI SHOWCASE BRIDA KOTA SURABAYA
    # =========================================================================
    hdr_table = doc.add_table(rows=1, cols=1)
    hdr_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cell = hdr_table.cell(0, 0)
    set_cell_background(hdr_cell, "0B1120")
    set_cell_margins(hdr_cell, top=130, bottom=130, left=180, right=180)
    set_row_cant_split(hdr_table.rows[0])

    p_badge = hdr_cell.paragraphs[0]
    p_badge.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_badge.paragraph_format.space_after = Pt(3)
    r_badge = p_badge.add_run(
        "DOKUMEN LAPORAN INOVASI  •  INOVBOYO 2.0 BRIDA KOTA SURABAYA"
    )
    r_badge.bold = True
    r_badge.font.size = Pt(9)
    r_badge.font.color.rgb = RGBColor(0x38, 0xBD, 0xF8)

    p_main_title = hdr_cell.add_paragraph()
    p_main_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_main_title.paragraph_format.space_after = Pt(4)
    r_main = p_main_title.add_run(
        "CIRCUIT SANDBOX: LABORATORIUM VIRTUAL RANGKAIAN LISTRIK,\n"
        "PEMBANGKIT ENERGI ALAM & KALKULATOR BIAYA LISTRIK PLN"
    )
    r_main.bold = True
    r_main.font.size = Pt(13.5)
    r_main.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    p_tagline = hdr_cell.add_paragraph()
    p_tagline.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_tagline.paragraph_format.space_after = Pt(0)
    r_tag = p_tagline.add_run(
        "Media pembelajaran listrik IPA yang aman tanpa takut tersetrum, bisa mencoba Panel Surya & Kincir Angin "
        "di alam terbuka, serta langsung menghitung perkiraan tagihan listrik PLN dalam mata uang Rupiah."
    )
    r_tag.italic = True
    r_tag.font.size = Pt(9.5)
    r_tag.font.color.rgb = RGBColor(0xA7, 0xF3, 0xD0)

    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_after = Pt(3)

    # =========================================================================
    # TABEL IDENTITAS INOVASI & TIM PENGEMBANG SMPN 12 SURABAYA (SLIDE 1)
    # =========================================================================
    meta_table = doc.add_table(rows=8, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.style = 'Table Grid'

    meta_rows = [
        ("Nama Inovasi", "Circuit Sandbox — Laboratorium Fisika Virtual & Simulasi Energi Terbarukan"),
        ("Kategori Showcase Resmi", "Inovboyo Young Heroes (Khusus Pelajar SMP/MTs) — Sub-Kategori: Technology, Web, and Digital Innovation serta Green & Renewable Energy"),
        ("Ketua Tim / Kreator", "KENZIE RAKA ROMERO  (NISN: 0128794397 / Kelas IX SMPN 12 Surabaya)"),
        ("Asal Sekolah", "SMP Negeri 12 Surabaya (Jl. Ngagel Jaya Selatan No. 39, Surabaya)"),
        ("Guru Pembimbing", "Ibu Uki  (NIP. ........................................ / Guru Pembimbing IPA SMPN 12 Surabaya)"),
        ("Email / Nomor Kontak", "rakaengineer@gmail.com  /  082330395585"),
        (
            "Tim Pengembang &\nKontributor Siswa",
            "1. Kenzie Raka Romero — Ketua Tim, Konseptor Ide Utama, Perancang Grafis & Pengembang Sistem\n"
            "2. Achmad Sandy Pratama — Pencari Kendala (Bug Finder) & Penguji Fungsi Aplikasi (Tester)\n"
            "3. Khaizuran Hamizan Setyawan — Pendamping Desain Tampilan & Penyusun Dokumentasi Riset\n"
            "4. Muhammad Andhika Parahita — Penguji Rangkaian Komponen & Simulasi Kelistrikan\n"
            "5. Muhammad Syafik Al Rosyid — Penguji Skenario Gangguan & Uji Coba Penggunaan di HP"
        ),
        (
            "Tautan Aplikasi Web",
            "https://circuit-gamma-one.vercel.app  (Dapat langsung dibuka di HP maupun laptop tanpa perlu instalasi)"
        ),
    ]

    for idx, (label, val) in enumerate(meta_rows):
        row = meta_table.rows[idx]
        set_row_cant_split(row)
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(1.9)
        c1.width = Inches(5.3)
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, top=50, bottom=50, left=90, right=90)
        set_cell_margins(c1, top=50, bottom=50, left=90, right=90)

        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(label)
        r0.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        p1.paragraph_format.line_spacing = 1.12
        r1 = p1.add_run(val)
        r1.font.size = Pt(9.5)
        if "https://" in val or "KENZIE RAKA ROMERO" in val or "Inovboyo Young Heroes" in val:
            r1.bold = True
            r1.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)
        else:
            r1.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    p_space2 = doc.add_paragraph()
    p_space2.paragraph_format.space_after = Pt(4)

    # =========================================================================
    # BAGIAN 1: LATAR BELAKANG, MASALAH UTAMA & PENGGUNA (SLIDE 3)
    # =========================================================================
    add_section_banner(
        doc,
        "1",
        "Latar Belakang, Masalah Utama & Pengguna Terdampak",
        "Kebutuhan nyata di sekolah yang melatarbelakangi lahirnya inovasi Circuit Sandbox"
    )

    p_intro = doc.add_paragraph()
    p_intro.paragraph_format.space_after = Pt(4)
    p_intro.paragraph_format.line_spacing = 1.15
    p_intro.add_run(
        "Pelajaran IPA Fisika tentang Listrik Dinamis (Rangkaian Seri dan Paralel) serta Energi Terbarukan adalah "
        "materi yang sangat penting bagi siswa SMP. Namun, dalam kegiatan pembelajaran sehari-hari di laboratorium sekolah, "
        "kami menemukan empat kendala nyata yang dihadapi siswa dan guru:"
    )

    add_bullet_point(
        doc,
        "1. Masalah Utama — Takut Tersetrum & Alat Rentan Rusak Saat Siswa Belajar: ",
        "Bagi siswa kelas 7 dan 8 yang baru pertama kali meraba alat listrik, ada rasa was-was dan takut tersetrum. "
        "Selain itu, jika kabel positif dan negatif tidak sengaja bersentuhan langsung (korsleting), baterai praktikum menjadi "
        "sangat panas dan bohlam kecil langsung putus terbakar sehingga tidak bisa dipakai lagi."
    )
    add_bullet_point(
        doc,
        "2. Keterbatasan Alat Praktikum di Laboratorium Sekolah: ",
        "Jumlah perangkat praktikum di sekolah sering kali terbatas, sehingga satu set alat harus dipakai bergantian oleh "
        "4 hingga 6 anak dalam kelompok besar. Sekolah juga jarang memiliki berbagai jenis lampu modern yang lengkap "
        "(seperti bohlam pijar, lampu hemat energi CFL, LED hemat daya, halogen, hingga lampu pintar RGB) serta alat ukur digital per siswa."
    )
    add_bullet_point(
        doc,
        "3. Teori Energi Terbarukan (PLTS & PLTB) Tidak Dapat Dipraktikkan Langsung: ",
        "Buku IPA Kurikulum Merdeka mengenalkan Panel Surya dan Turbin Angin. Namun di kelas, materi ini "
        "hanya bisa dipelajari lewat gambar mati di buku cetak, tanpa ada kesempatan mencoba bagaimana sinar matahari "
        "dan hembusan angin disalurkan lewat tiang listrik untuk menyalakan lampu di ruangan."
    )
    add_bullet_point(
        doc,
        "4. Belum Terhubungnya Rumus Fisika dengan Tagihan Listrik PLN di Rumah: ",
        "Siswa diajarkan rumus daya listrik (Watt) dan energi listrik (Joule), tetapi kesulitan memahami kaitannya "
        "dengan besaran tagihan listrik PLN dalam Rupiah yang dibayar orang tua setiap bulan di rumah."
    )

    p_who = doc.add_paragraph()
    p_who.paragraph_format.space_before = Pt(3)
    p_who.paragraph_format.space_after = Pt(2)
    p_who.paragraph_format.line_spacing = 1.15
    r_who_title = p_who.add_run("Siapa yang Terdampak & Bukti Singkat Lapangan:")
    r_who_title.bold = True
    r_who_title.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)

    add_bullet_point(
        doc,
        "• Pengguna & Penerima Manfaat Utama: ",
        "Seluruh siswa SMP/MTs di Kota Surabaya (terutama kelas VII, VIII, dan IX) serta Guru IPA yang membutuhkan media ajar interaktif, aman, dan tanpa biaya tambahan."
    )
    add_bullet_point(
        doc,
        "• Bukti Singkat Lapangan (Observasi Kualitatif di Laboratorium Sekolah): ",
        "Berdasarkan pengamatan langsung tim saat kegiatan praktikum IPA di laboratorium SMP Negeri 12 Surabaya, praktikum listrik sering terhenti karena bohlam pijar putus dan stok baterai praktikum cepat habis akibat kesalahan pasang kutub kabel. Selain itu, dalam diskusi kelas, sebagian besar siswa mengaku ragu saat menyambungkan rangkaian karena khawatir alat rusak atau timbul percikan api, serta belum memahami hubungan antara besaran Watt pada lampu kamar dengan biaya tagihan listrik PLN."
    )

    # =========================================================================
    # BAGIAN 2: SOLUSI YANG DITAWARKAN, CARA KERJA & KEBARUAN (SLIDE 2 & 5)
    # =========================================================================
    add_section_banner(
        doc,
        "2",
        "Solusi yang Ditawarkan, Cara Kerja Sederhana & Bukti Visual",
        "Penjelasan mudah tentang bagaimana Circuit Sandbox bekerja dan membantu siswa belajar"
    )

    p_sol = doc.add_paragraph()
    p_sol.paragraph_format.space_after = Pt(4)
    p_sol.paragraph_format.line_spacing = 1.15
    r_sol_b = p_sol.add_run("Solusi yang Diciptakan: ")
    r_sol_b.bold = True
    p_sol.add_run(
        "Untuk menjawab seluruh masalah di atas, kami merancang dan membangun Circuit Sandbox, yaitu laboratorium virtual "
        "berbasis web yang dapat diakses secara gratis langsung dari HP maupun komputer tanpa perlu memasang aplikasi. "
        "Aplikasi ini menggabungkan dua area eksperimen interaktif sekaligus:"
    )

    add_bullet_point(
        doc,
        "A. Meja Laboratorium Virtual (Mode Dalam Ruangan): ",
        "Siswa bebas menyusun Baterai 1,5V, Baterai 9V, Tempat Baterai, Saklar, Resistor, Multimeter Digital (Voltmeter & "
        "Amperemeter), serta 7 jenis lampu (Lampu Pijar, Edison, Halogen, Neon CFL, LED Putih, Smart RGB, dan LED Indikator). "
        "Lampu menyala redup atau terang secara alami sesuai besarnya arus listrik tanpa risiko meledak atau tersetrum."
    )
    add_bullet_point(
        doc,
        "B. Zona Alam Terbuka (Simulasi Energi Matahari & Angin): ",
        "Dengan menekan tombol 'Alam', siswa berpindah ke alam terbuka dengan bukit berumput dan aliran sungai. "
        "Di sini siswa dapat memasang Panel Surya dan Kincir Angin. Komponen di alam memiliki gaya gravitasi nyata "
        "(jatuh menapak tanah) dan akan meletup korsleting secara aman jika tercebur ke air sungai sebagai simulasi bahaya air terhadap listrik."
    )
    add_bullet_point(
        doc,
        "C. Transmisi Menara Listrik SUTET ke Panel Saklar MCB Laboratorium: ",
        "Listrik hijau dari panel surya dan turbin angin disalurkan melewati Menara Transmisi di bukit menuju Panel Distribusi "
        "di dalam laboratorium. Panel ini dilengkapi layar tegangan, tombol penurun tegangan (3V/6V/9V/12V), serta saklar MCB "
        "otomatis yang langsung 'jepret' memutus aliran listrik jika terjadi korsleting, persis seperti pengaman listrik PLN di rumah!"
    )
    add_bullet_point(
        doc,
        "D. Kalkulator Tagihan Listrik PLN (Rupiah) & Hemat Energi Hijau: ",
        "Setiap rangkaian yang dibuat otomatis dihitung daya listriknya (Watt), konsumsi energinya (kWh), dan estimasi biaya tagihan "
        "PLN dalam mata uang Rupiah per hari, bulan, dan tahun sesuai golongan tarif resmi pemerintah (900 VA Subsidi Rp 605/kWh, "
        "900 VA Non-Subsidi Rp 1.352/kWh, 1.300–2.200 VA Rp 1.444,70/kWh, hingga 3.500+ VA Rp 1.699,53/kWh). Jika disuplai "
        "oleh panel surya atau kincir angin, aplikasi menampilkan penghematan hingga tagihan menjadi Rp 0 (Gratis dari Alam)!"
    )

    p_cara = doc.add_paragraph()
    p_cara.paragraph_format.space_before = Pt(3)
    p_cara.paragraph_format.space_after = Pt(2)
    r_cara = p_cara.add_run("Langkah Penggunaan Sangat Mudah (5 Langkah Praktis):")
    r_cara.bold = True
    r_cara.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)

    steps_text = [
        ("Langkah 1 — Buka Web & Panduan Tutorial: ",
         "Buka tautan https://circuit-gamma-one.vercel.app pada peramban web HP atau laptop. Siswa baru dapat mengeklik tombol tutorial untuk dipandu langkah demi langkah."),
        ("Langkah 2 — Rangkai Alat di Meja Lab: ",
         "Ambil baterai, saklar, dan lampu dari kotak alat, lalu sambungkan ujung-ujung kabelnya. Saklar dapat diklik untuk menyala-padamkan lampu."),
        ("Langkah 3 — Pasang Pembangkit di Alam Terbuka: ",
         "Pindah ke mode Alam, tancapkan panel surya atau kincir angin di atas bukit, lalu hubungkan kabelnya ke puncak Menara Transmisi."),
        ("Langkah 4 — Hitung Biaya Tagihan Listrik PLN: ",
         "Buka menu 'Info & Rumus' untuk memilih golongan listrik rumah (misal 1.300 VA) dan geser jam pemakaian per hari untuk melihat biaya Rupiah per bulannya."),
        ("Langkah 5 — Simpan Karya Rangkaian: ",
         "Klik tombol simpan agar rangkaian tersimpan di memori browser dan dapat dibuka kembali saat dinilai oleh Bapak/Ibu Guru."),
    ]
    for b_prefix, b_desc in steps_text:
        add_bullet_point(doc, b_prefix, b_desc)

    p_stat = doc.add_paragraph()
    p_stat.paragraph_format.space_before = Pt(3)
    p_stat.paragraph_format.space_after = Pt(2)
    p_stat.paragraph_format.line_spacing = 1.15
    r_stat_b = p_stat.add_run("Status Pengembangan & Kebaruan Dibanding Simulator Lama (Sesuai Arahan Panitia): ")
    r_stat_b.bold = True
    p_stat.add_run(
        "Status karya Circuit Sandbox saat ini adalah Prototipe Fungsional Siap Pakai (Working Interactive Prototype) yang telah selesai "
        "dibangun secara utuh, telah melalui serangkaian uji coba fungsional oleh tim siswa pengembang pada peramban web HP Android dan laptop, "
        "serta sudah tayang daring secara publik (https://circuit-gamma-one.vercel.app). "
        "Dibandingkan simulator konvensional, Circuit Sandbox menghadirkan tiga pembaruan spesifik: "
        "(1) Penggabungan Meja Lab dengan Zona Alam Terbuka beranimasi, (2) Transmisi energi hijau dengan menara SUTET dan saklar "
        "pengaman MCB auto-trip yang realistis, serta (3) Kalkulator Tagihan Listrik PLN dalam mata uang Rupiah asli."
    )

    # Visual Evidence Table (Structured Grid with PLN Calculator Prominently Featured)
    p_vis_hdr = doc.add_paragraph()
    p_vis_hdr.paragraph_format.space_before = Pt(4)
    p_vis_hdr.paragraph_format.space_after = Pt(3)
    r_vh = p_vis_hdr.add_run("Bukti Visual Inovasi (Tangkapan Layar Asli Penggunaan Circuit Sandbox):")
    r_vh.bold = True
    r_vh.font.size = Pt(10)
    r_vh.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    img_table = doc.add_table(rows=3, cols=2)
    img_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    img_table.style = 'Table Grid'

    def format_img_cell(cell, img_path, caption, img_width_in=1.65):
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, top=50, bottom=50, left=70, right=70)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        p_img = cell.paragraphs[0]
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_after = Pt(2)
        if os.path.exists(img_path):
            run_img = p_img.add_run()
            run_img.add_picture(img_path, width=Inches(img_width_in))
        p_cap = cell.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(0)
        p_cap.paragraph_format.line_spacing = 1.05
        r_cap = p_cap.add_run(caption)
        r_cap.font.size = Pt(8)
        r_cap.italic = True
        r_cap.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    # Format rows
    for r in img_table.rows:
        set_row_cant_split(r)

    # Row 0
    c00 = img_table.rows[0].cells[0]
    c00.width = Inches(3.6)
    format_img_cell(c00, IMG_WELCOME, "Gambar 1: Tampilan Awal & Panduan Tutorial Interaktif yang ramah bagi siswa baru.", 1.55)

    c01 = img_table.rows[0].cells[1]
    c01.width = Inches(3.6)
    format_img_cell(c01, IMG_LAB_CIRCUIT, "Gambar 2: Meja Lab Virtual dengan 7 Jenis Lampu, Saklar, dan Pengukuran Multimeter.", 1.85)

    # Row 1: Merged for PLN Calculator
    c10 = img_table.rows[1].cells[0]
    c11 = img_table.rows[1].cells[1]
    c1_merged = c10.merge(c11)
    c1_merged.width = Inches(7.2)
    format_img_cell(
        c1_merged,
        IMG_PLN_CALC,
        "Gambar 3: Panel Info & Rumus serta Kalkulator Tagihan Listrik PLN (Rupiah & kWh) — Menghitung biaya listrik harian, bulanan, serta penghematan energi surya/angin secara otomatis sesuai tarif resmi pemerintah.",
        4.6
    )

    # Row 2: Gambar 4 & Gambar 5
    c20 = img_table.rows[2].cells[0]
    c20.width = Inches(3.6)
    format_img_cell(c20, IMG_OUTDOOR_SOLAR, "Gambar 4: Zona Alam Terbuka — Pembangkit Panel Surya & Turbin Angin di atas bukit rumput.", 1.45)

    c21 = img_table.rows[2].cells[1]
    c21.width = Inches(3.6)
    format_img_cell(c21, IMG_OUTDOOR_TOWER, "Gambar 5: Menara Transmisi SUTET yang menyalurkan listrik bersih ke Panel MCB Lab.", 1.45)

    p_sp3 = doc.add_paragraph()
    p_sp3.paragraph_format.space_after = Pt(4)

    # =========================================================================
    # BAGIAN 3: KEUNGGULAN & KEBARUAN INOVASI
    # =========================================================================
    add_section_banner(
        doc,
        "3",
        "Keunggulan & Kebaruan Inovasi Dibandingkan Media Lain",
        "Perbandingan nyata antara praktikum konvensional / simulator lama dengan Circuit Sandbox"
    )

    comp_table = doc.add_table(rows=6, cols=3)
    comp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    comp_table.style = 'Table Grid'

    headers = ["Aspek Pembelajaran", "Praktikum Fisik / Simulator Konvensional", "Keunggulan Circuit Sandbox (Inovasi Kami)"]
    for col_i, h_text in enumerate(headers):
        cell = comp_table.rows[0].cells[col_i]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=60, bottom=60, left=85, right=85)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h_text)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    set_row_cant_split(comp_table.rows[0])

    comp_rows = [
        (
            "1. Ruang Eksperimen (Dual-World)",
            "Hanya berupa papan datar di dalam satu ruangan tanpa simulasi lingkungan luar.",
            "Memiliki 2 dunia interaktif sekaligus: Meja Laboratorium dan Zona Alam Terbuka (bukit rumput & sungai) yang dihubungkan Menara Transmisi SUTET."
        ),
        (
            "2. Kalkulator Biaya Listrik PLN (Rupiah)",
            "Hanya menampilkan angka voltase dan ampere tanpa menghubungkannya dengan biaya nyata.",
            "Mengubah daya (Watt) menjadi rupiah nyata (Rp/hari, Rp/bulan, Rp/tahun) berdasarkan tarif resmi PLN, lengkap dengan fitur hemat listrik energi hijau."
        ),
        (
            "3. Pengaman Listrik & Akurasi Nyata",
            "Bohlam langsung rusak atau tidak ada efek apa pun saat terjadi kesalahan sambung.",
            "Dilengkapi saklar MCB auto-trip yang langsung 'jepret' memutus arus saat korsleting, Dioda Penahan Arus Balik, dan aturan kutub lampu LED (+ / -)."
        ),
        (
            "4. Interaksi Fisika Lingkungan Alam",
            "Komponen diam kaku dan tidak terpengaruh oleh lingkungan alam sekitarnya.",
            "Komponen di alam memiliki efek gravitasi nyata (jatuh ke tanah) dan akan meletup korsleting jika tercebur ke air sungai sebagai edukasi keselamatan."
        ),
        (
            "5. Kemudahan Akses & Biaya (Rp 0)",
            "Alat fisik rawan habis/rusak, sedangkan aplikasi lain sering kali berat atau berbahasa asing.",
            "100% gratis, dapat langsung dibuka di peramban web HP Android/iPhone maupun laptop sekolah tanpa instalasi, serta dilengkapi panduan bahasa Indonesia."
        ),
    ]

    for row_idx, (aspek, konv, unggul) in enumerate(comp_rows, start=1):
        row = comp_table.rows[row_idx]
        set_row_cant_split(row)
        vals = [aspek, konv, unggul]
        widths = [Inches(1.6), Inches(2.4), Inches(3.2)]
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for c_i in range(3):
            cell = row.cells[c_i]
            cell.width = widths[c_i]
            set_cell_background(cell, "ECFDF5" if c_i == 2 else bg)
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.08
            r = p.add_run(vals[c_i])
            r.font.size = Pt(8.5)
            if c_i == 0:
                r.bold = True
                r.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
            elif c_i == 2:
                r.bold = True
                r.font.color.rgb = RGBColor(0x06, 0x5F, 0x46)
            else:
                r.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    p_sp4 = doc.add_paragraph()
    p_sp4.paragraph_format.space_after = Pt(4)

    # =========================================================================
    # BAGIAN 4: DAMPAK, MANFAAT & PENERAPAN NYATA (SLIDE 2 & EVALUASI JURI)
    # =========================================================================
    add_section_banner(
        doc,
        "4",
        "Dampak, Manfaat & Pengujian Internal oleh Tim Pengembang",
        "Bukti pengujian fungsional dan manfaat nyata yang dihadirkan oleh Circuit Sandbox"
    )

    add_bullet_point(
        doc,
        "1. Hasil Pengujian Fungsional Internal oleh Tim Pengembang Siswa SMPN 12 Surabaya: ",
        "Seluruh fitur aplikasi telah diuji coba secara intensif oleh tim penguji siswa (Kenzie Raka Romero, Achmad Sandy Pratama, "
        "Muhammad Andhika Parahita, dan Muhammad Syafik Al Rosyid) menggunakan perangkat HP Android (layar sentuh) dan komputer laptop. "
        "Pengujian membuktikan bahwa perangkaian 7 jenis lampu, responsivitas sentuhan pada layar HP, proteksi saklar MCB saat korsleting, "
        "serta kalkulator tagihan listrik PLN dalam Rupiah berjalan lancar dan akurat."
    )
    add_bullet_point(
        doc,
        "2. Manfaat Finansial Bagi Laboratorium Sekolah (Penghematan Komponen Habis Pakai): ",
        "Dengan tersedianya laboratorium virtual ini, sekolah dapat menghemat anggaran pembelian baterai kering dan bohlam cadangan "
        "yang rawan putus saat praktikum pemula. Guru IPA dapat mendemonstrasikan konsep rangkaian seri, paralel, dan bahaya korsleting "
        "secara interaktif di depan kelas tanpa khawatir alat rusak."
    )
    add_bullet_point(
        doc,
        "3. Kesiapan Replikasi Penuh untuk Seluruh SMP/MTs di Kota Surabaya (Biaya Rp 0): ",
        "Karena Circuit Sandbox berbasis web ringan, aplikasi ini dapat langsung diakses oleh sekolah mana pun di Kota Surabaya "
        "tanpa perlu membeli server baru, tanpa biaya langganan, dan tanpa spesifikasi perangkat tinggi. Siswa cukup membuka "
        "tautan web melalui ponsel pintar masing-masing."
    )
    add_bullet_point(
        doc,
        "4. Mendukung Gerakan Sekolah Adiwiyata & Surabaya Kota Ramah Lingkungan: ",
        "Fitur Zona Alam Terbuka serta simulasi penghematan energi hijau menanamkan budaya ramah lingkungan dan kepedulian terhadap "
        "transisi energi bersih kepada generasi muda sejak bangku SMP, selaras dengan visi Kota Surabaya sebagai kota hijau berwawasan lingkungan."
    )

    # =========================================================================
    # BAGIAN 5: REFERENSI DATA ILMIAH (SNI/IEC) & LEMBAR PENGESAHAN
    # =========================================================================
    add_section_banner(
        doc,
        "5",
        "Referensi Standar Ilmiah (SNI/IEC/Datasheet) & Lembar Pengesahan",
        "Bukti keabsahan parameter ilmiah kelistrikan dan komitmen kejujuran akademik"
    )

    p_ref_intro = doc.add_paragraph()
    p_ref_intro.paragraph_format.space_after = Pt(3)
    p_ref_intro.paragraph_format.line_spacing = 1.12
    p_ref_intro.add_run(
        "Meskipun disajikan dalam bahasa dan tampilan yang sangat ramah bagi siswa SMP, seluruh nilai hambatan (Ω), tegangan (V), "
        "daya maksimum (W), hambatan dalam baterai, serta tarif listrik di dalam Circuit Sandbox dihitung menggunakan rumus fisika "
        "yang akurat (Hukum Ohm, Hukum Kirchhoff, dan R = V²/P) berdasarkan standar resmi kelistrikan nasional dan internasional:"
    )

    ref_table = doc.add_table(rows=13, cols=3)
    ref_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    ref_table.style = 'Table Grid'

    ref_headers = ["Nama Komponen / Alat", "Spesifikasi & Rumus Fisika di Simulator", "Dasar Standar Ilmiah (SNI / IEC / Datasheet Resmi)"]
    for col_i, h_text in enumerate(ref_headers):
        cell = ref_table.rows[0].cells[col_i]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=45, bottom=45, left=70, right=70)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h_text)
        r.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    set_row_cant_split(ref_table.rows[0])

    ref_rows = [
        ("1. Lampu Pijar (E27)", "R = 800 Ω, Maks 40 W (1,5V–24V DC; R = 220²/60 ≈ 806 Ω)", "SNI IEC 60064:2014 & Philips Standard A55 40W–60W E27 Datasheet"),
        ("2. Lampu Edison (ST64 E27)", "R = 1200 Ω, Maks 30 W (Nyala amber mulai 1,5V–5V; R = 220²/40 = 1210 Ω)", "SNI IEC 60064:2014, US Patent 223,898 & Philips Vintage ST64 2200K"),
        ("3. Lampu Halogen (G4/G9 Pin)", "R = 1500 Ω, Maks 50 W, Kaki 2-Pin (1,5V–24V DC; R = 220²/32,2 ≈ 1500 Ω)", "IEC 60357:2002 (Tungsten Halogen) & Osram Halopin G4/G9 Datasheet"),
        ("4. Lampu Neon CFL (E27)", "R_eq = 3000 Ω, Maks 15 W, Aman < 18V DC (R_eq = 220²/16,1 ≈ 3000 Ω)", "SNI IEC 60968:2015 & Philips Tornado CFL 15W E27 6500K Datasheet"),
        ("5. Lampu LED Putih (E27)", "R_eq = 4500 Ω, Maks 9 W, Aman < 12V DC, Searah (Anoda + / Katoda -)", "SNI IEC 62560:2015 & Philips MyCare LEDBulb 9W E27 Datasheet"),
        ("6. Smart RGB LED (E27)", "R_eq = 6000 Ω, Maks 7 W, Aman < 9V DC, Searah (Tri-Chip RGB + PWM)", "SNI IEC 62560:2015, CIE 1931 RGB & Philips WiZ Smart RGB 7W–8W"),
        ("7. LED Indikator 5mm Hijau", "R_eq = 5000 Ω (Modul Trainer), Maks 3 W, Aman < 8V DC (V_f ≈ 2,1V)", "IEC 60747-5-5 & Vishay TLHG5400 / Kingbright 5mm GaP LED Datasheet"),
        ("8. Baterai AA, 9V & Wadah 2×AA", "AA: 1,5V (R_in 0,2Ω); Wadah 2×AA Seri: 3,0V; 9V: 9,0V (R_in 2,0Ω, 6 sel)", "SNI 04-2051.2 / IEC 60086-2 (LR6 & 6LR61) & Energizer E91/522 Datasheet"),
        ("9. Panel Surya & Turbin Angin", "Output 0–12V DC (Terik 12V, Mendung 5V) + Penyearah AC-DC & Blocking Diode", "SNI IEC 61215:2016 (PV STC), SNI IEC 62109-1 & IEC 61400-2 (Turbin Angin)"),
        ("10. Menara & Panel MCB Lab", "Transmisi Antar-Ruang + Proteksi MCB Auto-Trip Korsleting & Step-Down DC", "SNI 0225:2011 (PUIL 2011), SNI IEC 60898-1 (MCB) & IEC 61140 (SELV)"),
        ("11. Fiting E27, Soket Pin, Resistor, Saklar", "Fiting Ulir E27, Keramik Bi-Pin G4/G9, Resistor 1–1000Ω, Saklar R_on=1mΩ", "SNI IEC 60238 (E27), SNI IEC 60400 (G4/G9), IEC 60062 & SNI IEC 60669-1"),
        ("12. Voltmeter, Amperemeter & Tarif PLN", "Voltmeter R_in=10MΩ (Paralel), Ammeter R_shunt=1mΩ (Seri), Tarif R-1/TR", "IEC 61010-1 (Fluke DMM 10MΩ), IEEE CAS MNA (1975) & Permen ESDM / PLN"),
    ]

    for row_idx, (c_name, c_spec, c_src) in enumerate(ref_rows, start=1):
        row = ref_table.rows[row_idx]
        set_row_cant_split(row)
        vals = [c_name, c_spec, c_src]
        widths = [Inches(1.75), Inches(2.65), Inches(2.8)]
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for c_i in range(3):
            cell = row.cells[c_i]
            cell.width = widths[c_i]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=35, bottom=35, left=65, right=65)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            r = p.add_run(vals[c_i])
            r.font.size = Pt(8)
            if c_i == 0:
                r.bold = True
                r.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
            elif c_i == 2:
                r.bold = True
                r.font.color.rgb = RGBColor(0x06, 0x5F, 0x46)
            else:
                r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    p_sp5 = doc.add_paragraph()
    p_sp5.paragraph_format.space_after = Pt(3)

    p_close = doc.add_paragraph()
    p_close.paragraph_format.space_after = Pt(4)
    p_close.paragraph_format.line_spacing = 1.15
    p_close.add_run(
        "Circuit Sandbox membuktikan bahwa siswa jenjang SMP di Kota Surabaya mampu menghadirkan karya teknologi "
        "pendidikan yang nyata, bermanfaat, dan menyenangkan bagi sesama pelajar. Inovasi ini siap disosialisasikan "
        "dan dimanfaatkan secara lebih luas untuk mendukung pembelajaran sains di Kota Surabaya.\n"
    )
    r_orig = p_close.add_run(
        "Pernyataan Orisinalitas Karya: Karya inovasi 'Circuit Sandbox' ini dirancang dan dikembangkan secara orisinal "
        "oleh Kenzie Raka Romero bersama Tim Siswa SMP Negeri 12 Surabaya di bawah bimbingan Guru Pembimbing Ibu Uki, "
        "tanpa plagiarisme terhadap karya pihak mana pun."
    )
    r_orig.bold = True
    r_orig.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    # Formal Signature Block (Specific date: 2 November 2026, Materai & School Stamp space)
    sig_table = doc.add_table(rows=1, cols=2)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_row_cant_split(sig_table.rows[0])
    c_left, c_right = sig_table.rows[0].cells[0], sig_table.rows[0].cells[1]
    c_left.width = Inches(3.6)
    c_right.width = Inches(3.6)
    set_cell_margins(c_left, top=60, bottom=60, left=80, right=80)
    set_cell_margins(c_right, top=60, bottom=60, left=80, right=80)

    p_l = c_left.paragraphs[0]
    p_l.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_l.paragraph_format.line_spacing = 1.15
    p_l.add_run("Mengetahui,\nGuru Pembimbing SMP Negeri 12 Surabaya\n\n\n\n\n\n")
    r_l_name = p_l.add_run("( Ibu Uki )\n")
    r_l_name.bold = True
    r_l_nip = p_l.add_run("NIP. ........................................\nGuru Pembimbing IPA SMPN 12 Surabaya")
    r_l_nip.font.size = Pt(8.5)

    p_r = c_right.paragraphs[0]
    p_r.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_r.paragraph_format.line_spacing = 1.15
    p_r.add_run("Surabaya, 2 November 2026\nKetua Tim Inovator,\n\n\n\n\n\n")
    r_r_name = p_r.add_run("( KENZIE RAKA ROMERO )\n")
    r_r_name.bold = True
    r_r_nisn = p_r.add_run("NISN: 0128794397\nKetua Tim Inovator — SMP Negeri 12 Surabaya")
    r_r_nisn.font.size = Pt(8.5)

    # Add Materai & School Stamp guidance note
    p_mat = doc.add_paragraph()
    p_mat.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_mat.paragraph_format.space_before = Pt(4)
    p_mat.paragraph_format.space_after = Pt(0)
    r_mat = p_mat.add_run("[ Dokumen Resmi Ditandatangani di atas Materai Rp 10.000 & Disahkan Stempel Resmi SMP Negeri 12 Surabaya ]")
    r_mat.italic = True
    r_mat.font.size = Pt(8.5)
    r_mat.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    doc.save(OUTPUT_DOCX_PRIMARY)
    print(f"Successfully generated clean honest document: {OUTPUT_DOCX_PRIMARY}")


if __name__ == "__main__":
    build_report()
