<?php
$categoriaSeleccionada = $_POST['seleccion-categoria'];
$nombreArchivoCSV = 'report_Job.csv';
$enlaceFijo = 'https://envasesempT1.valhalla19.stage.jobs2web.com/job-invite/';

if (($handle = fopen($nombreArchivoCSV, "r")) !== FALSE) {
    $encabezados = fgetcsv($handle);
    $indiceCategoria = array_search('Categoria', $encabezados);
    $indiceNombre = array_search('Nombre de la posición', $encabezados); /*Nombre de la posición*/
    $indiceEstado = array_search('Ubicación', $encabezados); /*Ubicación*/
    $indiceLink = array_search('ID de requisición de personal', $encabezados); /*ID de requisición de personal*/
    $indiceEP = array_search('Estado de publicación', $encabezados); // EP = ESTADO DE RIQUISICIÓN Estado de publicación

    if ($indiceCategoria === FALSE || $indiceNombre === FALSE || $indiceEstado === FALSE || $indiceLink === FALSE ) {
        echo json_encode(["error" => "Una o más columnas requeridas no se encontraron."]);
        fclose($handle);
        exit;
    }
    
    
    fseek($handle, 0); 
    fgetcsv($handle);
    
    $resultados = [];
    while (($fila = fgetcsv($handle, 1000, ",")) !== FALSE) {
        
        
        if ($fila[$indiceCategoria] === $categoriaSeleccionada && $fila[$indiceEP] === "Publicado" ) {
            
            $enlaceCompleto = $enlaceFijo . $fila[$indiceLink];
            
            $resultados[] = [
                "nombre" => $fila[$indiceNombre],
                "categoria" => $fila[$indiceCategoria],
                "estado" => $fila[$indiceEstado],
                "link" => $enlaceCompleto
            ];
        }
    }

    fclose($handle);


    if (empty($resultados)) {
        echo json_encode(["error" => "No encontré coincidencias."]);
    } else {
        echo json_encode($resultados);
    }
} else {
    echo json_encode(["error" => "Error al abrir el archivo CSV."]);
}
?>