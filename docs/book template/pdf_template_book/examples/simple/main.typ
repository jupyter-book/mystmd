// Update this import to where you put the `lapreprint.typ` file
// It should probably be in the same folder
#import "../../book.typ": template

#show: template.with(
  title: "Pixels and their Neighbours",
  subtitle: "A Tutorial on Finite Volume",
)

= DC Resistivity <dc-resistivity>

DC resistivity surveys obtain information about subsurface electrical conductivity, $sigma$. This physical property is often diagnostic in mineral exploration, geotechnical, environmental and hydrogeologic problems, where the target of interest has a significant electrical conductivity contrast from the background. In a DC resistivity survey, steady state currents are set up in the subsurface by injecting current through a positive electrode and completing the circuit with a return electrode (@dc-setup).


#figure(
  image("files/dc-setup.png", width: 50%),
  caption: [Setup of a DC resistivity survey.],
  placement: bottom
) <dc-setup>

The equations for DC resistivity are derived in (@dc-eqns). Conservation of charge (which can be derived by taking the divergence of Ampere's law at steady state) connects the divergence of the current density everywhere in space to the source term which consists of two point sources, one positive and one negative.

The flow of current sets up electric fields according to Ohm's law, which relates current density to electric fields through the electrical conductivity. From Faraday's law for steady state fields, we can describe the electric field in terms of a scalar potential, $phi$, which we sample at potential electrodes to obtain data in the form of potential differences.

#figure(
  image("files/dc-eqns.png", width: 100%),
  caption: [Derivation of the DC resistivity equations.],
) <dc-eqns>

To set up a solvable system of equations, we need the same number of unknowns as equations, in this case two unknowns (one scalar, $phi$, and one vector $arrow(j)$) and two first-order equations (one scalar, one vector).

In this tutorial, we walk through setting up these first order equations in finite volume in three steps: (1) defining where the variables live on the mesh; (2) looking at a single cell to define the discrete divergence and the weak formulation; and (3) moving from a cell based view to the entire mesh to construct and solve the resulting matrix system. The notebooks included with this tutorial leverage the #link("http://simpeg.xyz/")[SimPEG] package, which extends the methods discussed here to various mesh types.

== Where do things live? <where-do-things-live>

To bring our continuous equations into the computer, we need to discretize the earth and represent it using a finite(!) set of numbers. In this tutorial we will explain the discretization in 2D and generalize to 3D in the notebooks. A 2D (or 3D!) mesh is used to divide up space, and we can represent functions (fields, parameters, etc.) on this mesh at a few discrete places: the nodes, edges, faces, or cell centers. For consistency between 2D and 3D we refer to faces having area and cells having volume, regardless of their dimensionality. Nodes and cell centers naturally hold scalar quantities while edges and faces have implied directionality and therefore naturally describe vectors. The conductivity, $sigma$, changes as a function of space, and is likely to have discontinuities (e.g. if we cross a geologic boundary). As such, we will represent the conductivity as a constant over each cell, and discretize it at the center of the cell. The electrical current density, $arrow(j)$, will be continuous across conductivity interfaces, and therefore, we will represent it on the faces of each cell. Remember that $arrow(j)$ is a vector; the direction of it is implied by the mesh definition (i.e. in $x$, $y$ or $z$), so we can store the array $bold(j)$ as _scalars_ that live on the face and inherit the face's normal. When $arrow(j)$ is defined on the faces of a cell the potential, $phi$, will be put on the cell centers (since $arrow(j)$ is related to $phi$ through spatial derivatives, it allows us to approximate centered derivatives leading to a staggered, second-order discretization). Once we have the functions placed on our mesh, we look at a single cell to discretize each first order equation. For simplicity in this tutorial we will choose to have all of the faces of our mesh be aligned with our spatial axes ($x$, $y$ or $z$), the extension to curvilinear meshes will be presented in the supporting notebooks.

#figure(
  image("files/mesh.png", width: 100%),
  caption: [Anatomy of a finite volume cell.],
) <fig-mesh>

== One cell at a time <one-cell-at-a-time>

To discretize the first order differential equations we consider a single cell in the mesh and we will work through the discrete description of equations (1) and (2) over that cell.

=== In and out <id-1-in-and-out>

#figure(
  image("files/divergence.png", width: 100%),
  caption: [Geometrical definition of the divergence and the discretization.],
) <fig-div>

So we have half of the equation discretized - the left hand side. Now we need to take care of the source: it contains two dirac delta functions - these are infinite at their origins, $r_(s^+)$ and $r_(s^-)$. However, the volume integral of a delta function _is_ well defined: it is _unity_ if the volume contains the origin of the delta function otherwise it is _zero_.

As such, we can integrate both sides of the equation over the volume enclosed by the cell. Since $bold(D) bold(j)$ is constant over the cell, the integral is simply a multiplication by the volume of the cell $"v"bold(D) bold(j)$. The integral of the source is zero unless one of the source electrodes is located inside the cell, in which case it is $q = plus.minus I$. Now we have a discrete description of equation 1 over a single cell:

$ "v"bold(D) bold(j) = q $ <eq:div>

=== Scalar equations only, please <id-2-scalar-equations-only-please>

Equation @eq:div is a vector equation, so really it is two or three equations involving multiple components of $arrow(j)$. We want to work with a single scalar equation, allow for anisotropic physical properties, and potentially work with non-axis-aligned meshes - how do we do this?! We can use the *weak formulation* where we take the inner product ($integral arrow(a) dot.op arrow(b) d v$) of the equation with a generic face function, $arrow(f)$. This reduces requirements of differentiability on the original equation and also allows us to consider tensor anisotropy or curvilinear meshes.

In @fig-weak-formulation, we visually walk through the discretization of equation (b). On the left hand side, a dot product requires a _single_ cartesian vector, $bold(j_x comma j_y)$. However, we have a $j$ defined on each face (2 $j_x$ and 2 $j_y$ in 2D!). There are many different ways to evaluate this inner product: we could approximate the integral using trapezoidal, midpoint or higher order approximations. A simple method is to break the integral into four sections (or 8 in 3D) and apply the midpoint rule for each section using the closest $bold(j)$ components to compose a cartesian vector. A $bold(P)_i$ matrix (size $2 times 4$) is used to pick out the appropriate faces and compose the corresponding vector (these matrices are shown with colors corresponding to the appropriate face in the figure). On the right hand side, we use a vector identity to integrate by parts. The second term will cancel over the entire mesh (as the normals of adjacent cell faces point in opposite directions) and $phi$ on mesh boundary faces are zero by the Dirichlet boundary condition. This leaves us with the divergence, which we already know how to do!

#figure(
  image("files/weak-formulation.png", width: 90%),
  caption: [Discretization using the weak formulation and inner products.],
) <fig-weak-formulation>

The final step is to recognize that, now discretized, we can cancel the general face function $bold(f)$ and transpose the result (for convention's sake):

$ frac(1, 4) sum_(i = 1)^4 bold(P)_i^top sqrt(v) bold(Sigma)^(-1) sqrt(v) bold(P)_i bold(j) = bold(D)^top v phi $

= All together now <all-together-now>

We have now discretized the two first order equations over a single cell. What is left is to assemble and solve the DC system over the entire mesh. To implement the divergence on the full mesh, the stencil of $plus.minus$1's must index into $bold(j)$ on the entire mesh (instead of four elements). Although this can be done in a `for-loop`, it is conceptually, and often computationally, easier to create this stencil using nested Kronecker Products (see notebook). The volume and area terms in the divergence get expanded to diagonal matrices, and we multiply them together to get the discrete divergence operator. The discretization of the _face_ inner product can be abstracted to a function, $bold(M)_f (sigma^(-1))$, that completes the inner product on the entire mesh at once. The main difference when implementing this is the $bold(P)$ matrices, which must index into the entire mesh. With the necessary operators defined for both equations on the entire mesh, we are left with two discrete equations:

$ "diag"(bold(v)) bold(D) bold(j) = bold(q) $

$ bold(M)_f (sigma^(-1)) bold(j) = bold(D)^top "diag"(bold(v)) phi $

Note that now all variables are defined over the entire mesh. We could solve this coupled system or we could eliminate $bold(j)$ and solve for $phi$ directly (a smaller, second-order system).

$ "diag"(bold(v)) bold(D) bold(M)_f (sigma^(-1))^(-1) bold(D)^top "diag"(bold(v)) phi = bold(q) $

By solving this system matrix, we obtain a solution for the electric potential $phi$ everywhere in the domain. Creating predicted data from this requires an interpolation to the electrode locations and subtraction to obtain potential differences!

#figure(
  image("files/dc-results.png", width: 90%),
  caption: [Electric potential on (a) tensor and (b) curvilinear meshes.],
) <fig-results>

Moving from continuous equations to their discrete analogues is fundamental in geophysical simulations. In this tutorial, we have started from a continuous description of the governing equations for the DC resistivity problem, selected locations on the mesh to discretize the continuous functions, constructed differential operators by considering one cell at a time, assembled and solved the discrete DC equations. Composing the finite volume system in this way allows us to move to different meshes and incorporate various types of boundary conditions that are often necessary when solving these equations in practice.

Associated notebooks are available on #link("https://github.com/simpeg/tle-finitevolume")[GitHub] and can be run online with #link("http://mybinder.org/repo/simpeg/tle-finitevolume")[MyBinder].

All article content, except where otherwise noted (including republished material), is licensed under a Creative Commons Attribution 3.0 Unported License (CC BY-SA). See #link("https://creativecommons.org/licenses/by-sa/3.0/")[https:\/\/creativecommons.org/licenses/by-sa/3.0/]. Distribution or reproduction of this work in whole or in part commercially or noncommercially requires full attribution of the @Cockett_2016, including its digital object identifier (DOI). Derivatives of this work must carry the same license. All rights reserved.


// If you are using full-width pages, you must take care of your own bibliography.
// Otherwise it will be on a separate page
#{
  show bibliography: set text(8pt)
  bibliography("main.bib", title: text(10pt, "References"), style: "apa")
}
