package main

import (
	"fmt"
	"html/template"
	"net/http"
	"strings"
)

func main() {
	http.Handle("/", (http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tmp, err := template.ParseFiles("../index.html")
		if err != nil {
			fmt.Println(err)
		}
		tmp.Execute(w, nil)
	})))
	http.HandleFunc("/src/", HandelPics)
	fmt.Println("the server is up")
	http.ListenAndServe(":8000", nil)
}

func HandelPics(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	fmt.Println(path)
	validpath := strings.TrimPrefix(r.URL.Path, "/src/")
	// validpath = strings.TrimPrefix(r.URL.Path, "/defaultIMG/")
	if validpath == "" {
		// utils.WriteJSON(w, map[string]string{"error": "Forbidden"}, http.StatusForbidden)
		return
	}

	http.ServeFile(w, r, ".."+path)
}
